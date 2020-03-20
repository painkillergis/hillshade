const isExtentMalformed = () => Promise.resolve(false);
const isSizeMalformed = () => Promise.resolve(false);

/*
const isSizeInvalid = size => size === null
  || typeof size !== 'object'
  || typeof size.height !== 'number'
  || typeof size.width !== 'number'

const isExtentInvalid = extent => extent === null
  || typeof extent !== 'object'
  || typeof extent.left !== 'number'
  || typeof extent.top !== 'number'
  || typeof extent.right !== 'number'
  || typeof extent.bottom !== 'number'
*/

module.exports = { isExtentMalformed, isSizeMalformed };