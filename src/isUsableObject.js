import {
  isObject,
  isArray,
  isFunction,
  isRegExp,
  isNumber,
  isString,
  isElement,
  isDate
} from 'lodash';

export default function isUsableObject(val) {
  return isObject(val) && ! (
    isArray(val) || isFunction(val) || isRegExp(val) || isNumber(val) || isString(val) ||
    isElement(val) || isDate(val)
  );
}
