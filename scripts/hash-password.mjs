import bcrypt from "bcryptjs";

function readHiddenPassword(promptText) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    stdout.write(promptText);

    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      stdin.resume();
      stdin.setEncoding("utf8");
      stdin.once("data", (chunk) => resolve(String(chunk).trim()));
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char) => {
      if (char === "\u0003") {
        stdout.write("\n");
        process.exit(1);
      }

      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\n");
        stdin.off("data", onData);
        resolve(value);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    stdin.on("data", onData);
  });
}

const password = await readHiddenPassword("관리자 비밀번호를 입력하세요: ");

if (!password || password.length < 8) {
  console.error("비밀번호는 8자 이상으로 입력해 주세요.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const dotenvSafeHash = hash.replace(/\$/g, "\\$");
const base64Hash = Buffer.from(hash, "utf8").toString("base64");

console.log("\n권장 ADMIN_PASSWORD_HASH 값:");
console.log(base64Hash);
console.log("\n.env.local과 Vercel Environment Variables 모두 위 base64 값을 넣으세요.");
console.log("\n원본 bcrypt 해시가 필요할 때만 아래 값을 참고하세요:");
console.log(hash);
console.log("\n원본 bcrypt 해시를 .env.local에 넣을 때는 아래처럼 $를 \\$로 escape해야 합니다:");
console.log(`ADMIN_PASSWORD_HASH=${dotenvSafeHash}`);
console.log("\n평문 비밀번호는 저장하지 말고, 해시만 환경변수에 저장하세요.");
