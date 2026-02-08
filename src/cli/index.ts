#!/usr/bin/env node

import { Command } from "commander";
import { setVerbose } from "../core/logger.js";
import { registerConvertCommand } from "./commands/convert.js";
import { registerConvertersCommand } from "./commands/converters.js";
import { registerThemesCommand } from "./commands/themes.js";
import { registerInstallSkillsCommand } from "./commands/install-skills.js";

const program = new Command();

program
  .name("markwell")
  .description(
    "Convert documents to and from Markdown. The source from which polished documents flow.",
  )
  .version("0.1.0")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

registerConvertCommand(program);
registerConvertersCommand(program);
registerThemesCommand(program);
registerInstallSkillsCommand(program);

program.parse();
