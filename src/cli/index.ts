#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("markwell")
  .description(
    "Convert documents to and from Markdown. The source from which polished documents flow.",
  )
  .version("0.1.0");

program.parse();
