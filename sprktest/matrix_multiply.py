import os

import numpy as np
from pyspark.sql import SparkSession


def create_spark_session():
    """Створює SparkSession з підключенням до кластера"""
    master_url = os.getenv("SPARK_MASTER", "spark://spark-master:7077")

    return (
        SparkSession.builder.appName("MatrixMultiplication")
        .master(master_url)
        .config("spark.executor.memory", "7g")
        .config("spark.executor.cores", "4")
        .config("spark.driver.memory", "8g")
        .config("spark.driver.maxResultSize", "6g")
        .config("spark.executor.memoryFraction", "0.8")
        .config("spark.executor.instances", "1")
        .config("spark.default.parallelism", "200")
        .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
        .getOrCreate()
    )


def generate_matrix(size, seed=42):
    """Генерує матрицю заданого розміру"""
    np.random.seed(seed)
    # Генеруємо цілі числа від 0 до 1000 для економії пам'яті
    return np.random.randint(0, 1001, size=(size, size), dtype=np.int32)


def print_matrix_preview(matrix, name, size=10):
    """Виводить прев'ю матриці та статистику"""
    print("\n" + "=" * 60)
    print(f"{name}: розмір {matrix.shape}, тип {matrix.dtype}")
    print(f"{'=' * 60}")
    print(f"Перші {size}x{size} елементів:")
    print(matrix[:size, :size])
    print("\nСтатистика:")
    print(f"  Мінімум: {np.min(matrix)}")
    print(f"  Максимум: {np.max(matrix)}")
    print(f"  Середнє: {np.mean(matrix):.2f}")
    print(f"  Стандартне відхилення: {np.std(matrix):.2f}")


def multiply_matrices_spark(spark, matrix_a, matrix_b, block_size=1000):
    """
    Множить дві матриці використовуючи Spark з блочним підходом

    Args:
        spark: SparkSession
        matrix_a: numpy array (матриця A)
        matrix_b: numpy array (матриця B)
        block_size: розмір блоку для розбиття матриць

    Returns:
        Результат множення матриць
    """
    a = np.array(matrix_a)
    b = np.array(matrix_b)

    # Перевірка розмірів матриць
    if a.shape[1] != b.shape[0]:
        raise ValueError(f"Неможливо помножити матриці: {a.shape} та {b.shape}")

    rows_a, cols_a = a.shape
    rows_b, cols_b = b.shape

    print(f"Матриця A: {rows_a}x{cols_a}")
    print(f"Матриця B: {rows_b}x{cols_b}")
    print(f"Результат: {rows_a}x{cols_b}")
    print(f"Використовую блоки розміром {block_size}x{block_size}")

    # Broadcast матриці (ефективніше для великих матриць)
    print("Передаю матриці через broadcast...")
    broadcast_a = spark.sparkContext.broadcast(a)
    broadcast_b = spark.sparkContext.broadcast(b)

    # Створюємо індекси блоків замість самих блоків
    num_blocks_a = (rows_a + block_size - 1) // block_size
    num_blocks_b = (cols_b + block_size - 1) // block_size

    print(f"Створюю {num_blocks_a} блоків для A, {num_blocks_b} блоків для B")

    # Створюємо пари індексів (block_i, block_j) для всіх комбінацій
    block_indices = [(i, j) for i in range(num_blocks_a) for j in range(num_blocks_b)]

    # Функція для множення блоку A на блок B за індексами
    def multiply_block_indices(block_indices_pair):
        block_i, block_j = block_indices_pair
        a_broadcast = broadcast_a.value
        b_broadcast = broadcast_b.value

        # Обчислюємо координати блоків
        row_start = block_i * block_size
        row_end = min(row_start + block_size, rows_a)
        col_start = block_j * block_size
        col_end = min(col_start + block_size, cols_b)

        # Витягуємо блоки
        # Для блоку результату C[row_start:row_end, col_start:col_end]:
        # C[i,j] = sum_k(A[i,k] * B[k,j])
        # Отже, беремо рядки row_start:row_end з A і стовпці col_start:col_end з B
        block_a = a_broadcast[row_start:row_end, :]  # Всі стовпці A для цих рядків
        block_b = b_broadcast[:, col_start:col_end]  # Всі рядки B для цих стовпців

        # Множимо блоки: (rows_block_a, cols_a) @ (rows_b, cols_block_b) = (rows_block_a, cols_block_b)
        # де cols_a == rows_b (перевірено раніше)
        result_block = np.dot(block_a, block_b)

        # Перевірка розміру результату
        expected_rows = row_end - row_start
        expected_cols = col_end - col_start
        if result_block.shape != (expected_rows, expected_cols):
            raise ValueError(
                f"Невірний розмір результату блоку ({block_i}, {block_j}): "
                f"очікувалось {expected_rows}x{expected_cols}, отримано {result_block.shape}"
            )

        return ((block_i, block_j), result_block)

    # Створюємо RDD з індексів і множимо
    print("Виконую блочне множення...")
    rdd_indices = spark.sparkContext.parallelize(
        block_indices, numSlices=len(block_indices)
    )
    result_blocks = rdd_indices.map(multiply_block_indices).collect()

    # Збираємо результати в матрицю
    print("Збираю результати...")
    result_matrix = np.zeros((rows_a, cols_b), dtype=np.int32)

    # Сортуємо результати для послідовного збирання
    result_blocks_sorted = sorted(result_blocks, key=lambda x: (x[0][0], x[0][1]))

    for (block_i, block_j), block_result in result_blocks_sorted:
        row_start = block_i * block_size
        row_end = min(row_start + block_size, rows_a)
        col_start = block_j * block_size
        col_end = min(col_start + block_size, cols_b)

        # Перевірка розмірів блоку результату
        expected_rows = row_end - row_start
        expected_cols = col_end - col_start
        if block_result.shape != (expected_rows, expected_cols):
            raise ValueError(
                f"Неспівпадіння розмірів блоку: очікувалось {expected_rows}x{expected_cols}, "
                f"отримано {block_result.shape} для блоку ({block_i}, {block_j})"
            )

        result_matrix[row_start:row_end, col_start:col_end] = block_result

    # Видаляємо broadcast змінні
    broadcast_a.unpersist()
    broadcast_b.unpersist()

    return result_matrix


def main():
    """Головна функція"""
    print("=" * 60)
    print("Множення матриць через PySpark на кластері")
    print("=" * 60)

    # Створюємо SparkSession
    spark = create_spark_session()
    print(f"Spark Master: {spark.sparkContext.master}")
    print("Spark UI: http://spark-master:8080")

    try:
        # Розмір матриць
        matrix_size = 5000
        print(f"\nГенерую матриці розміром {matrix_size}x{matrix_size}...")

        # Генеруємо матриці
        print("Генерую матрицю A...")
        matrix_a = generate_matrix(matrix_size, seed=42)

        print("Генерую матрицю B...")
        matrix_b = generate_matrix(matrix_size, seed=123)

        # Виводимо початкові матриці
        preview_size = 10
        print_matrix_preview(matrix_a, "Матриця A", preview_size)
        print_matrix_preview(matrix_b, "Матриця B", preview_size)

        # Множення матриць
        print("\nПочинаю множення матриць...")
        import time

        start_time = time.time()

        result = multiply_matrices_spark(spark, matrix_a, matrix_b, block_size=1000)

        end_time = time.time()
        elapsed_time = end_time - start_time

        print(f"\nМноження завершено за {elapsed_time:.2f} секунд")

        # Виводимо результуючу матрицю
        print_matrix_preview(result, "Результуюча матриця (A × B)", preview_size)

        # Збереження матриць у файли (опціонально)
        save_to_file = os.getenv("SAVE_MATRICES", "false").lower() == "true"
        if save_to_file:
            print("\n" + "=" * 60)
            print("Зберігаю матриці у файли...")
            output_dir = "/opt/spark/data"
            os.makedirs(output_dir, exist_ok=True)

            # Зберігаємо у форматі .npy (бінарний NumPy формат)
            np.save(f"{output_dir}/matrix_a.npy", matrix_a)
            np.save(f"{output_dir}/matrix_b.npy", matrix_b)
            np.save(f"{output_dir}/result.npy", result)

            print(f"Матриці збережено у {output_dir}/:")
            print(f"  - matrix_a.npy ({matrix_a.nbytes / 1024 / 1024:.2f} MB)")
            print(f"  - matrix_b.npy ({matrix_b.nbytes / 1024 / 1024:.2f} MB)")
            print(f"  - result.npy ({result.nbytes / 1024 / 1024:.2f} MB)")
            print("\nДля завантаження використовуйте:")
            print(f"  matrix = np.load('{output_dir}/matrix_a.npy')")
            print("=" * 60)

        # Перевірка: множення невеликої частини через NumPy
        print("\nПеревірка на невеликій частині (100x100)...")
        small_a = matrix_a[:100, :100]
        small_b = matrix_b[:100, :100]
        np_result = np.dot(small_a, small_b)
        spark_result = result[:100, :100]

        # Перевірка для цілих чисел (точне порівняння)
        are_equal = np.array_equal(spark_result, np_result)

        # Обчислюємо максимальну різницю
        max_diff = np.max(
            np.abs(spark_result.astype(np.int64) - np_result.astype(np.int64))
        )
        mean_diff = np.mean(
            np.abs(spark_result.astype(np.int64) - np_result.astype(np.int64))
        )

        print("Результати збігаються (100x100):")
        print(f"  - Точне збігання: {are_equal}")
        print(f"  - Максимальна різниця: {max_diff}")
        print(f"  - Середня різниця: {mean_diff:.2f}")

    except Exception as e:
        print(f"Помилка: {e}")
        import traceback

        traceback.print_exc()
        raise

    finally:
        spark.stop()


if __name__ == "__main__":
    main()
