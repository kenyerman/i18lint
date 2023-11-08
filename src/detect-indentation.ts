import * as fs from 'fs';
import { globSync } from 'glob';

const mode = (arr: number[]): number | undefined => {
  if (arr.length === 0) return undefined;

  const modeMap: Record<number, number> = {};

  arr.forEach((e: any) => {
    modeMap[e] = (modeMap[e] || 0) + 1;
  });

  return Number.parseInt(Object.entries(modeMap).sort((a, b) => b[1] - a[1])[0][0]);
};

const indentationSpacesRegex = /^(\x20+)/gm;
const indentationTabsRegex = /^(\t+)/gm;

/**
 * Detects indentation of the source string
 * @throws {error} mixed spaces and tabs
 * @throws {error} indentation is uneven: [W] of size [X] vs [Y] of size [Z]
 */
const detectIndentation = (source: string): { char: 'tab' | 'space'; size: number } | null => {
  const spaces = source.match(indentationSpacesRegex);
  const tabs = source.match(indentationTabsRegex);

  // validate is indented
  if (!spaces && !tabs) return null;

  // validate pure
  if (spaces && tabs) throw new Error('mixed spaces and tabs');

  // validate sizes
  const indentations = (spaces || tabs)!.sort((a, b) => a.length - b.length);
  const initialIndentation = indentations[0];
  const initialIndentationSize = initialIndentation.length;
  for (let i = 1; i < indentations.length; i++) {
    const currentIndentation = indentations[i];
    const currentIndentationSize = currentIndentation.length;
    if (currentIndentationSize % initialIndentationSize !== 0) {
      throw new Error(
        `indentation is uneven: [${initialIndentation}] of size [${initialIndentationSize}] vs [${currentIndentation}] of size [${currentIndentationSize}]`
      );
    }
  }

  return {
    char: spaces ? 'space' : 'tab',
    size: indentations[0].length,
  };
};

export const detectProjectIndentation = (dir: string, forced?: number): { char: 'tab' | 'space'; size: number } => {
  if (forced) {
    return { char: 'space', size: forced };
  }
  // check for actual files for indentation
  const tabUsers: number[] = [];
  const spaceUsers: number[] = [];

  globSync(`${dir}/**/*.json`).forEach(f => {
    try {
      const content = fs.readFileSync(f, 'utf-8');
      const res = detectIndentation(content);

      if (res === null) {
        console.warn(`Could not read file ${f} while detecting indentation.`);
        return;
      }

      switch (res.char) {
        case 'space':
          spaceUsers.push(res.size);
          break;
        case 'tab':
          tabUsers.push(res.size);
          break;
      }
    } catch (e) {
      console.warn(`Could not read file ${f} while detecting indentation.`);
    }
  });

  if (!tabUsers.length && !spaceUsers.length) {
    console.warn(`Could not detect indentation, defaulting to 4.`);
    return { char: 'space', size: 4 };
  }

  if (spaceUsers.length < tabUsers.length) {
    return { char: 'tab', size: mode(tabUsers)! };
  }

  return { char: 'space', size: mode(spaceUsers)! };
};

export const getProjectIndentor = (char: 'tab' | 'space', size: number): string | number => {
  if (char === 'space') {
    return size;
  }

  return Array.from({ length: size })
    .map(() => '\t')
    .join('');
};
