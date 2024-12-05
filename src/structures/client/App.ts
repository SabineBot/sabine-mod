import { Client, ClientOptions } from "oceanic.js"
import mongoose from "mongoose"
import { readdirSync } from "fs"
import path from "path"
import { Command } from "../command/createCommand"

export default class App extends Client {
  public commands: Map<string, Command> = new Map();
  public aliases: Map<string, string> = new Map();
  public constructor(options?: ClientOptions) {
    super(options);
  }
  public async start() {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Database connected!");
    await this.connect();
    for(const file of readdirSync(path.join(__dirname, "../../listeners"))) {
      const listener = (await import(`../../listeners/${file}`)).default.default ?? (await import(`../../listeners/${file}`)).default;
      if(listener.name === "ready") this.once("ready", () => listener.run(this).catch(console.error));
      else this.on(listener.name, (...args) => listener.run(this, ...args).catch(console.error));
    }
    for(const file of readdirSync(path.join(__dirname, "../../commands"))) {
      const command = (await import(`../../commands/${file}`)).default.default ?? (await import(`../../commands/${file}`)).default;
      this.commands.set(command.name, command);
      if(command.aliases) {
        command.aliases.forEach((alias: string) => {
          this.aliases.set(alias, command.name);
        });
      }
    }
  }
}