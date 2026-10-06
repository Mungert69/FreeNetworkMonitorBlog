const matter = require('gray-matter');
const yaml = require('js-yaml');

// gray-matter's default YAML engine calls the retired safeLoad/safeDump APIs.
// Modern js-yaml load/dump use the safe schema by default, including YAML dates.
module.exports = function parseFrontmatter(source) {
  return matter(source, {
    engines: {
      yaml: { parse: yaml.load, stringify: yaml.dump },
    },
  });
};
