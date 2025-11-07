import { defaultEngine } from "./dialog/index";

function runOnce(input: string) {
  const engine = defaultEngine();
  const reply = engine.respond(input);
  process.stdout.write(reply + "\n");
}

async function runInteractive() {
  const engine = defaultEngine();
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  rl.setPrompt("");
  const ask = () =>
    rl.question("Ви: ", (line: string) => {
      const reply = engine.respond(line);
      process.stdout.write("Бот: " + reply + "\n");
      ask();
    });
  ask();
}

const arg = process.argv.slice(2).join(" ").trim();
if (arg) {
  runOnce(arg);
} else {
  runInteractive();
}
