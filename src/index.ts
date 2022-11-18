#!/usr/bin/env node
import * as fs from 'fs';
import { join } from 'path';
import { exit } from 'process';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import stringify from 'json-stable-stringify';

import { languageCodes } from './language-codes.js';

const argv = await yargs(hideBin(process.argv))
  .scriptName("i18linter")
  .positional('dir', {
    type: 'string',
    description: 'The path to the translation files',
    demandOption: true
  })
  .option('rewrite', {
    type: 'boolean',
    alias: 'r',
    description: 'Rewrite the translation files with pretty printing and ordered keys'
  })
  .argv;

const rootDirectory = argv._[0] as string;
const rewrite = argv.rewrite;
const indentationSize = 4;

/**
 * Structuring can be:
 *  1: directory contains subdirs with language codes contain translation files with translation unit names
 *  2: directory contains translation units named after language codes
 */
const main = (dir: string): void => {
  const names = fs.readdirSync(dir);

  if (!names?.length) {
    console.error("Fatal: The given directory is empty.");
    exit(1);
  }

  // assuming extensionless names as subdirs
  // if directory contains a subdir, it must contain subdirs only
  if (names.some(e => e.includes('.')) && !names.every(e => e.includes('.'))) {
    console.error(`Fatal: The given directory: "${dir}" must contain subdirectories or directly the translation files.`);
    exit(1);
  }

  const usedLanguages: string[] = [];

  // structure 1:
  if (names.every(e => !e.includes('.'))) {
    const languageDirs = names;
    const filesToExclude: string[] = [];
    const existingTranslationUnits = new Set<string>();

    // language dirs must be named after a language code
    let hasLanguageCodeError = false;
    languageDirs.forEach(langDir => {
      if (!Object.keys(languageCodes).includes(langDir.split('-')[0])) {
        if (!hasLanguageCodeError) {
          hasLanguageCodeError = true;
          console.error('\nError: Some subdirectories does not follow the ISO 639-1 standard:');
        }

        console.error(`\tLanguage directory "${langDir}" is not an ISO 639-1 language code.`);
        return;
      }

      usedLanguages.push(langDir);
    });

    // language subdir should contain only files
    let hasBadFileError = false;
    languageDirs.forEach(langDir => {
      const translationUnits = fs.readdirSync(join(dir, langDir));

      translationUnits.forEach(unit => {
        const path = join(dir, langDir, unit);

        if (!unit.includes('.json')) {
          if (!hasBadFileError) {
            hasBadFileError = true;
            console.error(`\nError: Found files in bad position:`);
          }

          console.error(`\tFile "${path}" should be a json translation unit.`);
          filesToExclude.push(path);
          return;
        }

        existingTranslationUnits.add(unit);
      })
    });

    // all translation units must exist in all languages
    let missingUnit = false;
    languageDirs.forEach(langDir => {
      const translationUnits = fs.readdirSync(join(dir, langDir));

      existingTranslationUnits.forEach(unit => {
        const path = join(dir, langDir, unit);

        if (!translationUnits.includes(unit)) {
          if (!missingUnit) {
            missingUnit = true;
            console.error(`\nError: Found missing translation units:`);
          }

          console.error(`\tTranslation unit "${unit}" is missing from language "${langDir}"`);

          filesToExclude.push(path);
        }
      })
    });

    const unitTree: any = {};

    // translation units should be able to be parsed as json
    let wrongJsonError = false;
    languageDirs.forEach(langDir => {
      const translationUnits = fs.readdirSync(join(dir, langDir));

      translationUnits.forEach(unit => {
        const path = join(dir, langDir, unit);

        if (filesToExclude.includes(path)) {
          return;
        }

        try {
          const unitData = fs.readFileSync(path);
          const unitContent = JSON.parse(unitData as unknown as string);
          unitTree[langDir] = { ...unitTree[langDir], [unit]: unitContent };
        } catch {
          if (!wrongJsonError) {
            wrongJsonError = true;
            console.error(`\nError: Found non JSON parseable files:`);
          }

          console.error(`\tFile "${path}" cannot be parsed.`);
          filesToExclude.push(path);
        }
      })
    });

    const usedKeys: Record<string, Set<string>> = {};
    // translation unit in bad format
    let badFormat = false;
    usedLanguages.forEach(lang => {
      existingTranslationUnits.forEach(unit => {
        const path = join(dir, lang, unit);

        if (filesToExclude.includes(path)) {
          return;
        }

        const { values, packageName } = unitTree[lang][unit];

        const filePackageName = unit.split('.json')[0];

        if (packageName === undefined) {
          if (!badFormat) {
            badFormat = true;
            console.error('\nError: Found translation units with bad format.');
          }

          console.error(`\tTranslation unit "${path}" missing the "packageName" key.`);
          filesToExclude.push(path);
        }

        if (packageName !== undefined && typeof packageName !== 'string') {
          if (!badFormat) {
            badFormat = true;
            console.error('\nError: Found translation units with bad format.');
          }

          console.error(`\tTranslation unit "${path}" "packageName" should be string.`);
          filesToExclude.push(path);
        }

        if (packageName !== undefined && typeof packageName === 'string' && packageName !== filePackageName) {
          if (!badFormat) {
            badFormat = true;
            console.error('\nError: Found translation units with bad format.');
          }

          console.error(`\tTranslation unit "${path}" should have "packageName": "${filePackageName}", found "${packageName}".`);
          filesToExclude.push(path);
        }

        if (values === undefined) {
          if (!badFormat) {
            badFormat = true;
            console.error('\nError: Found translation units with bad format.');
          }

          console.error(`\tTranslation unit "${path}" missing the "values" key.`);
          filesToExclude.push(path);
        }

        const keys = Object.keys(values);

        keys.forEach(k => {
          if (!usedKeys[unit]) {
            usedKeys[unit] = new Set<string>();
          }

          usedKeys[unit].add(k);

          const translation = values[k];

          if (typeof translation !== 'string') {
            if (!badFormat) {
              badFormat = true;
              console.error('\nError: Found translation units with bad format.');
            }

            console.error(`\tTranslation unit "${path}" has "${k}" with badly formatted value.`);
            filesToExclude.push(path);
          }
        })
      })
    })

    // check for missing keys
    let hasMissingKeys = false;
    usedLanguages.forEach(lang => {
      existingTranslationUnits.forEach(unit => {
        const path = join(dir, lang, unit);

        if (filesToExclude.includes(path)) {
          return;
        }

        const keysInUnit = Object.keys(unitTree[lang][unit]['values']);

        usedKeys[unit].forEach(key => {
          if (!keysInUnit.includes(key)) {
            if (!hasMissingKeys) {
              hasMissingKeys = true;
              console.error("\nError: Found missing translations.");
            }

            console.error(`\t Translation unit "${path}" misses the key: "${key}".`);
            filesToExclude.push(path);
          }
        });
      })
    });

    if (rewrite) {
      usedLanguages.forEach(lang => {
        existingTranslationUnits.forEach(unit => {
          const path = join(dir, lang, unit);
  
          if (filesToExclude.includes(path)) {
            return;
          }

          const data = unitTree[lang][unit];
          const pretty = stringify(data, {
            space: indentationSize
          });

          fs.writeFileSync(path, pretty);
        })
      });
    }

    if (
      hasLanguageCodeError ||
      hasBadFileError ||
      missingUnit ||
      wrongJsonError ||
      badFormat ||
      hasMissingKeys
    ) {
      exit(1);
    }

    exit(0);
  }

  // structure 2:
  if (names.every(e => e.includes('.'))) {
    const languages = names;
    const filesToExclude: string[] = [];

    // check non .json files
    let hasBadFileError = false;
    languages.forEach(lang => {
      const path = join(dir, lang);

      if (!lang.endsWith('.json')) {
        if (!hasBadFileError) {
          hasBadFileError = true;
          console.error(`\nError: Found files in bad position:`);
        }

        console.error(`\tFile "${path}" should be a json translation unit.`);
        filesToExclude.push(path);
      }
    });

    // files must be named after a language code
    let hasLanguageCodeError = false;
    languages.forEach(lang => {
      const path = join(dir, lang);

      if (filesToExclude.includes(path)) {
        return;
      }

      const foundLangCode = lang.split('.json')[0].split('-')[0];

      if (!Object.keys(languageCodes).includes(foundLangCode)) {
        if (!hasLanguageCodeError) {
          hasLanguageCodeError = true;
          console.error('\nError: Some subdirectories does not follow the ISO 639-1 standard:');
        }

        console.error(`\tTranslation file "${path}" is not named as an ISO 639-1 language code.`);
      }
    });

    const langTree: Record<string, any> = {};

    // translation units should be able to be parsed as json
    let wrongJsonError = false;
    languages.forEach(lang => {
      const path = join(dir, lang);

      if (filesToExclude.includes(path)) {
        return;
      }

      try {
        const unitData = fs.readFileSync(path);
        const unitContent = JSON.parse(unitData as unknown as string);
        langTree[lang] = unitContent;
      } catch {
        if (!wrongJsonError) {
          wrongJsonError = true;
          console.error(`\nError: Found non JSON parseable files:`);
        }

        console.error(`\tFile "${path}" cannot be parsed.`);
        filesToExclude.push(path);
      }
    });

    const usedKeys = new Set<string>();
    const usedKeysByLang: Record<string, Set<string>> = {};

    // translation unit should either use nesting or namespacing ('.')
    let structureError = false;
    let structureType: 'NAMESPACING' | 'NESTING' | null = null;
    languages.forEach(lang => {
      const path = join(dir, lang);

      if (filesToExclude.includes(path)) {
        return;
      }

      const data = langTree[lang];
      const checkLevel = (level: any, fullkey: string = "") => {
        Object.keys(level).forEach(k => {
          const namespacing = k.includes('.');
          const v = level[k];
          const nesting = typeof v !== "string";

          // prefer nesting
          if (structureType === null) {
            if (nesting) {
              structureType = 'NESTING';
            }

            if (!nesting && namespacing) {
              structureType = 'NAMESPACING';
            }
          }

          if (namespacing && structureType === 'NESTING') {
            if (!structureError) {
              structureError = true;
              console.error(`\nError: Found mixing of namespaces and nesting:`);
            }

            console.error(`\tFile "${path}" contains namespacing on key ${fullkey}.${k} when nesting is already in use.`);
          }

          if (nesting && structureType === 'NAMESPACING') {
            if (!structureError) {
              structureError = true;
              console.error(`\nError: Found mixing of namespaces and nesting:`);
            }

            console.error(`\tFile "${path}" contains nested object on key ${fullkey}.${k} when namespacing is already in use.`);
          }
        })

        Object.keys(level).forEach(k => {
          const v = level[k];

          const newLevelKey = fullkey+'.'+k;

          if (typeof v === 'string') {
            usedKeys.add(newLevelKey);

            if (usedKeysByLang[lang] === undefined) {
              usedKeysByLang[lang] = new Set<string>();
            }

            usedKeysByLang[lang].add(newLevelKey);

            return;
          }

          if (typeof v === 'object') {
            checkLevel(v, newLevelKey);
          }

        })
      }

      checkLevel(data);
    });

    // check for missing keys
    let hasMissingKeys = false;
    languages.forEach(lang => {
      const path = join(dir, lang);

      if (filesToExclude.includes(path)) {
        return;
      }

      usedKeys.forEach(key => {
        if (!usedKeysByLang[lang].has(key)) {
          if (!hasMissingKeys) {
            hasMissingKeys = true;
            console.error(`\nError: Found missing translations:`);
          }

          console.error(`\tFile "${path}" misses translation for key ${key}.`);
        }
      })
    });

    if (rewrite) {
      languages.forEach(lang => {
        const path = join(dir, lang);

        if (filesToExclude.includes(path)) {
          return;
        }

        const data = langTree[lang];
        const pretty = stringify(data, {
          space: indentationSize
        })

        fs.writeFileSync(path, pretty);
      })
    }

    if (
      hasBadFileError ||
      hasLanguageCodeError ||
      wrongJsonError ||
      structureError ||
      hasMissingKeys 
    ) {
      exit(1);
    }

    exit(0);
  }

  console.error("Fatal: Cannot understand translation files structuring.")
  exit(1);
}

main(rootDirectory);
