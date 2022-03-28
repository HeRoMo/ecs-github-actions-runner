module.exports = {
  test(val: any) {
    return typeof val === 'string';
  },
  serialize(val: any) {
    return `"${val.replace(/[a-z0-9]{64}.zip/, '[HASH REMOVED]')}"`;
  },
};
