// see https://github.com/facebook/jest/blob/main/packages/pretty-format/README.md#serialize
module.exports = {
  test(val: any) {
    return typeof val === 'string' && /[a-z0-9]{64}.zip/.test(val);
  },
  serialize(val: string, config: object, indentation: string, depth: number, refs: any[]) {
    if (refs[depth - 1].S3Key === val) {
      return '"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.zip"';
    }
    return val;
  },
};
