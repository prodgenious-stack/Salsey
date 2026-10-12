import { copyFileSync, mkdirSync, readdirSync } from "fs"

copyFileSync("manifest.json", "dist/manifest.json")
console.log("Copied manifest.json -> dist/")

mkdirSync("dist/icons", { recursive: true })
for (const file of readdirSync("icons")) {
  copyFileSync(`icons/${file}`, `dist/icons/${file}`)
}
console.log("Copied icons/ -> dist/icons/")
