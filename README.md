# i18lint

This script lints your translation files and rewrites them in a way that keys are sorted.
Compatible with `@ngx-translate`

## Installation
The script is npm available. You can install via:
```
npm i @kenyerman/i18lint -g
```

## Usage

### Simple example
```
i18lint path/to/translations/root --rewrite
```

### Help output
```
$ i18lint --help
Positionals:
  dir  The path to the translation files                                [string]

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -r, --rewrite  Rewrite the translation files with pretty printing and ordered
                 keys                                                  [boolean]
```

## Features (planned)
- [x] Check directory structure
- [x] Check files validity
- [x] Enforce ISO 639-1 language codes
- [x] Enforce commitment between namespacing or nesting
- [x] Check for missing translations between languages
- [x] Sort translation keys (rewrite files)
- [ ] Config file
- [ ] Enforce configured key separator (e.g. `dash` or `underscore`)

## Changelog

[Learn about the latest improvements](CHANGELOG.md).

## Contributing

### Contributing Guidelines

Read through our [contributing guidelines](CONTRIBUTING.md) to learn about our submission process, coding rules and more.

### Want to Help?

Want to report a bug, contribute some code, or improve documentation? Excellent! Read up on our guidelines for [contributing](CONTRIBUTING.md) and then check out one of our issues labeled as <kbd>[help wanted](https://github.com/kenyerman/i18lint/labels/help%20wanted)</kbd> or <kbd>[good first issue](https://github.com/kenyerman/i18lint/labels/good%20first%20issue)</kbd>.

## License

The project is licensed under MIT License. Read more [here](LICENSE).
