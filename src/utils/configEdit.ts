const fs = require('fs');

export const configEdit = (key: string, value: string) => {
  let parsed = JSON.parse(fs.readFileSync('../config.json').toString());

  parsed[key] = value;

  fs.writeFileSync('../config.json', JSON.stringify(parsed));
};
