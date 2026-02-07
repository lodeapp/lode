"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/lodash/compact.js
var require_compact = __commonJS({
  "node_modules/lodash/compact.js"(exports2, module2) {
    function compact(array) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    module2.exports = compact;
  }
});

// node_modules/lodash/_listCacheClear.js
var require_listCacheClear = __commonJS({
  "node_modules/lodash/_listCacheClear.js"(exports2, module2) {
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }
    module2.exports = listCacheClear;
  }
});

// node_modules/lodash/eq.js
var require_eq = __commonJS({
  "node_modules/lodash/eq.js"(exports2, module2) {
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    module2.exports = eq;
  }
});

// node_modules/lodash/_assocIndexOf.js
var require_assocIndexOf = __commonJS({
  "node_modules/lodash/_assocIndexOf.js"(exports2, module2) {
    var eq = require_eq();
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }
    module2.exports = assocIndexOf;
  }
});

// node_modules/lodash/_listCacheDelete.js
var require_listCacheDelete = __commonJS({
  "node_modules/lodash/_listCacheDelete.js"(exports2, module2) {
    var assocIndexOf = require_assocIndexOf();
    var arrayProto = Array.prototype;
    var splice = arrayProto.splice;
    function listCacheDelete(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }
    module2.exports = listCacheDelete;
  }
});

// node_modules/lodash/_listCacheGet.js
var require_listCacheGet = __commonJS({
  "node_modules/lodash/_listCacheGet.js"(exports2, module2) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheGet(key) {
      var data = this.__data__, index = assocIndexOf(data, key);
      return index < 0 ? void 0 : data[index][1];
    }
    module2.exports = listCacheGet;
  }
});

// node_modules/lodash/_listCacheHas.js
var require_listCacheHas = __commonJS({
  "node_modules/lodash/_listCacheHas.js"(exports2, module2) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }
    module2.exports = listCacheHas;
  }
});

// node_modules/lodash/_listCacheSet.js
var require_listCacheSet = __commonJS({
  "node_modules/lodash/_listCacheSet.js"(exports2, module2) {
    var assocIndexOf = require_assocIndexOf();
    function listCacheSet(key, value) {
      var data = this.__data__, index = assocIndexOf(data, key);
      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }
    module2.exports = listCacheSet;
  }
});

// node_modules/lodash/_ListCache.js
var require_ListCache = __commonJS({
  "node_modules/lodash/_ListCache.js"(exports2, module2) {
    var listCacheClear = require_listCacheClear();
    var listCacheDelete = require_listCacheDelete();
    var listCacheGet = require_listCacheGet();
    var listCacheHas = require_listCacheHas();
    var listCacheSet = require_listCacheSet();
    function ListCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype["delete"] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;
    module2.exports = ListCache;
  }
});

// node_modules/lodash/_stackClear.js
var require_stackClear = __commonJS({
  "node_modules/lodash/_stackClear.js"(exports2, module2) {
    var ListCache = require_ListCache();
    function stackClear() {
      this.__data__ = new ListCache();
      this.size = 0;
    }
    module2.exports = stackClear;
  }
});

// node_modules/lodash/_stackDelete.js
var require_stackDelete = __commonJS({
  "node_modules/lodash/_stackDelete.js"(exports2, module2) {
    function stackDelete(key) {
      var data = this.__data__, result = data["delete"](key);
      this.size = data.size;
      return result;
    }
    module2.exports = stackDelete;
  }
});

// node_modules/lodash/_stackGet.js
var require_stackGet = __commonJS({
  "node_modules/lodash/_stackGet.js"(exports2, module2) {
    function stackGet(key) {
      return this.__data__.get(key);
    }
    module2.exports = stackGet;
  }
});

// node_modules/lodash/_stackHas.js
var require_stackHas = __commonJS({
  "node_modules/lodash/_stackHas.js"(exports2, module2) {
    function stackHas(key) {
      return this.__data__.has(key);
    }
    module2.exports = stackHas;
  }
});

// node_modules/lodash/_freeGlobal.js
var require_freeGlobal = __commonJS({
  "node_modules/lodash/_freeGlobal.js"(exports2, module2) {
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    module2.exports = freeGlobal;
  }
});

// node_modules/lodash/_root.js
var require_root = __commonJS({
  "node_modules/lodash/_root.js"(exports2, module2) {
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module2.exports = root;
  }
});

// node_modules/lodash/_Symbol.js
var require_Symbol = __commonJS({
  "node_modules/lodash/_Symbol.js"(exports2, module2) {
    var root = require_root();
    var Symbol2 = root.Symbol;
    module2.exports = Symbol2;
  }
});

// node_modules/lodash/_getRawTag.js
var require_getRawTag = __commonJS({
  "node_modules/lodash/_getRawTag.js"(exports2, module2) {
    var Symbol2 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    module2.exports = getRawTag;
  }
});

// node_modules/lodash/_objectToString.js
var require_objectToString = __commonJS({
  "node_modules/lodash/_objectToString.js"(exports2, module2) {
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    module2.exports = objectToString;
  }
});

// node_modules/lodash/_baseGetTag.js
var require_baseGetTag = __commonJS({
  "node_modules/lodash/_baseGetTag.js"(exports2, module2) {
    var Symbol2 = require_Symbol();
    var getRawTag = require_getRawTag();
    var objectToString = require_objectToString();
    var nullTag = "[object Null]";
    var undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module2.exports = baseGetTag;
  }
});

// node_modules/lodash/isObject.js
var require_isObject = __commonJS({
  "node_modules/lodash/isObject.js"(exports2, module2) {
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    module2.exports = isObject;
  }
});

// node_modules/lodash/isFunction.js
var require_isFunction = __commonJS({
  "node_modules/lodash/isFunction.js"(exports2, module2) {
    var baseGetTag = require_baseGetTag();
    var isObject = require_isObject();
    var asyncTag = "[object AsyncFunction]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var proxyTag = "[object Proxy]";
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }
    module2.exports = isFunction;
  }
});

// node_modules/lodash/_coreJsData.js
var require_coreJsData = __commonJS({
  "node_modules/lodash/_coreJsData.js"(exports2, module2) {
    var root = require_root();
    var coreJsData = root["__core-js_shared__"];
    module2.exports = coreJsData;
  }
});

// node_modules/lodash/_isMasked.js
var require_isMasked = __commonJS({
  "node_modules/lodash/_isMasked.js"(exports2, module2) {
    var coreJsData = require_coreJsData();
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
      return uid ? "Symbol(src)_1." + uid : "";
    })();
    function isMasked(func) {
      return !!maskSrcKey && maskSrcKey in func;
    }
    module2.exports = isMasked;
  }
});

// node_modules/lodash/_toSource.js
var require_toSource = __commonJS({
  "node_modules/lodash/_toSource.js"(exports2, module2) {
    var funcProto = Function.prototype;
    var funcToString = funcProto.toString;
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {
        }
        try {
          return func + "";
        } catch (e) {
        }
      }
      return "";
    }
    module2.exports = toSource;
  }
});

// node_modules/lodash/_baseIsNative.js
var require_baseIsNative = __commonJS({
  "node_modules/lodash/_baseIsNative.js"(exports2, module2) {
    var isFunction = require_isFunction();
    var isMasked = require_isMasked();
    var isObject = require_isObject();
    var toSource = require_toSource();
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var reIsNative = RegExp(
      "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    );
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }
    module2.exports = baseIsNative;
  }
});

// node_modules/lodash/_getValue.js
var require_getValue = __commonJS({
  "node_modules/lodash/_getValue.js"(exports2, module2) {
    function getValue(object, key) {
      return object == null ? void 0 : object[key];
    }
    module2.exports = getValue;
  }
});

// node_modules/lodash/_getNative.js
var require_getNative = __commonJS({
  "node_modules/lodash/_getNative.js"(exports2, module2) {
    var baseIsNative = require_baseIsNative();
    var getValue = require_getValue();
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : void 0;
    }
    module2.exports = getNative;
  }
});

// node_modules/lodash/_Map.js
var require_Map = __commonJS({
  "node_modules/lodash/_Map.js"(exports2, module2) {
    var getNative = require_getNative();
    var root = require_root();
    var Map2 = getNative(root, "Map");
    module2.exports = Map2;
  }
});

// node_modules/lodash/_nativeCreate.js
var require_nativeCreate = __commonJS({
  "node_modules/lodash/_nativeCreate.js"(exports2, module2) {
    var getNative = require_getNative();
    var nativeCreate = getNative(Object, "create");
    module2.exports = nativeCreate;
  }
});

// node_modules/lodash/_hashClear.js
var require_hashClear = __commonJS({
  "node_modules/lodash/_hashClear.js"(exports2, module2) {
    var nativeCreate = require_nativeCreate();
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }
    module2.exports = hashClear;
  }
});

// node_modules/lodash/_hashDelete.js
var require_hashDelete = __commonJS({
  "node_modules/lodash/_hashDelete.js"(exports2, module2) {
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }
    module2.exports = hashDelete;
  }
});

// node_modules/lodash/_hashGet.js
var require_hashGet = __commonJS({
  "node_modules/lodash/_hashGet.js"(exports2, module2) {
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? void 0 : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : void 0;
    }
    module2.exports = hashGet;
  }
});

// node_modules/lodash/_hashHas.js
var require_hashHas = __commonJS({
  "node_modules/lodash/_hashHas.js"(exports2, module2) {
    var nativeCreate = require_nativeCreate();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
    }
    module2.exports = hashHas;
  }
});

// node_modules/lodash/_hashSet.js
var require_hashSet = __commonJS({
  "node_modules/lodash/_hashSet.js"(exports2, module2) {
    var nativeCreate = require_nativeCreate();
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
      return this;
    }
    module2.exports = hashSet;
  }
});

// node_modules/lodash/_Hash.js
var require_Hash = __commonJS({
  "node_modules/lodash/_Hash.js"(exports2, module2) {
    var hashClear = require_hashClear();
    var hashDelete = require_hashDelete();
    var hashGet = require_hashGet();
    var hashHas = require_hashHas();
    var hashSet = require_hashSet();
    function Hash(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    Hash.prototype.clear = hashClear;
    Hash.prototype["delete"] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;
    module2.exports = Hash;
  }
});

// node_modules/lodash/_mapCacheClear.js
var require_mapCacheClear = __commonJS({
  "node_modules/lodash/_mapCacheClear.js"(exports2, module2) {
    var Hash = require_Hash();
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        "hash": new Hash(),
        "map": new (Map2 || ListCache)(),
        "string": new Hash()
      };
    }
    module2.exports = mapCacheClear;
  }
});

// node_modules/lodash/_isKeyable.js
var require_isKeyable = __commonJS({
  "node_modules/lodash/_isKeyable.js"(exports2, module2) {
    function isKeyable(value) {
      var type = typeof value;
      return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
    }
    module2.exports = isKeyable;
  }
});

// node_modules/lodash/_getMapData.js
var require_getMapData = __commonJS({
  "node_modules/lodash/_getMapData.js"(exports2, module2) {
    var isKeyable = require_isKeyable();
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
    }
    module2.exports = getMapData;
  }
});

// node_modules/lodash/_mapCacheDelete.js
var require_mapCacheDelete = __commonJS({
  "node_modules/lodash/_mapCacheDelete.js"(exports2, module2) {
    var getMapData = require_getMapData();
    function mapCacheDelete(key) {
      var result = getMapData(this, key)["delete"](key);
      this.size -= result ? 1 : 0;
      return result;
    }
    module2.exports = mapCacheDelete;
  }
});

// node_modules/lodash/_mapCacheGet.js
var require_mapCacheGet = __commonJS({
  "node_modules/lodash/_mapCacheGet.js"(exports2, module2) {
    var getMapData = require_getMapData();
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }
    module2.exports = mapCacheGet;
  }
});

// node_modules/lodash/_mapCacheHas.js
var require_mapCacheHas = __commonJS({
  "node_modules/lodash/_mapCacheHas.js"(exports2, module2) {
    var getMapData = require_getMapData();
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }
    module2.exports = mapCacheHas;
  }
});

// node_modules/lodash/_mapCacheSet.js
var require_mapCacheSet = __commonJS({
  "node_modules/lodash/_mapCacheSet.js"(exports2, module2) {
    var getMapData = require_getMapData();
    function mapCacheSet(key, value) {
      var data = getMapData(this, key), size = data.size;
      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }
    module2.exports = mapCacheSet;
  }
});

// node_modules/lodash/_MapCache.js
var require_MapCache = __commonJS({
  "node_modules/lodash/_MapCache.js"(exports2, module2) {
    var mapCacheClear = require_mapCacheClear();
    var mapCacheDelete = require_mapCacheDelete();
    var mapCacheGet = require_mapCacheGet();
    var mapCacheHas = require_mapCacheHas();
    var mapCacheSet = require_mapCacheSet();
    function MapCache(entries) {
      var index = -1, length = entries == null ? 0 : entries.length;
      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype["delete"] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;
    module2.exports = MapCache;
  }
});

// node_modules/lodash/_stackSet.js
var require_stackSet = __commonJS({
  "node_modules/lodash/_stackSet.js"(exports2, module2) {
    var ListCache = require_ListCache();
    var Map2 = require_Map();
    var MapCache = require_MapCache();
    var LARGE_ARRAY_SIZE = 200;
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }
    module2.exports = stackSet;
  }
});

// node_modules/lodash/_Stack.js
var require_Stack = __commonJS({
  "node_modules/lodash/_Stack.js"(exports2, module2) {
    var ListCache = require_ListCache();
    var stackClear = require_stackClear();
    var stackDelete = require_stackDelete();
    var stackGet = require_stackGet();
    var stackHas = require_stackHas();
    var stackSet = require_stackSet();
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }
    Stack.prototype.clear = stackClear;
    Stack.prototype["delete"] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;
    module2.exports = Stack;
  }
});

// node_modules/lodash/_setCacheAdd.js
var require_setCacheAdd = __commonJS({
  "node_modules/lodash/_setCacheAdd.js"(exports2, module2) {
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }
    module2.exports = setCacheAdd;
  }
});

// node_modules/lodash/_setCacheHas.js
var require_setCacheHas = __commonJS({
  "node_modules/lodash/_setCacheHas.js"(exports2, module2) {
    function setCacheHas(value) {
      return this.__data__.has(value);
    }
    module2.exports = setCacheHas;
  }
});

// node_modules/lodash/_SetCache.js
var require_SetCache = __commonJS({
  "node_modules/lodash/_SetCache.js"(exports2, module2) {
    var MapCache = require_MapCache();
    var setCacheAdd = require_setCacheAdd();
    var setCacheHas = require_setCacheHas();
    function SetCache(values) {
      var index = -1, length = values == null ? 0 : values.length;
      this.__data__ = new MapCache();
      while (++index < length) {
        this.add(values[index]);
      }
    }
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;
    module2.exports = SetCache;
  }
});

// node_modules/lodash/_arraySome.js
var require_arraySome = __commonJS({
  "node_modules/lodash/_arraySome.js"(exports2, module2) {
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    module2.exports = arraySome;
  }
});

// node_modules/lodash/_cacheHas.js
var require_cacheHas = __commonJS({
  "node_modules/lodash/_cacheHas.js"(exports2, module2) {
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    module2.exports = cacheHas;
  }
});

// node_modules/lodash/_equalArrays.js
var require_equalArrays = __commonJS({
  "node_modules/lodash/_equalArrays.js"(exports2, module2) {
    var SetCache = require_SetCache();
    var arraySome = require_arraySome();
    var cacheHas = require_cacheHas();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      var arrStacked = stack.get(array);
      var othStacked = stack.get(other);
      if (arrStacked && othStacked) {
        return arrStacked == other && othStacked == array;
      }
      var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
      stack.set(array, other);
      stack.set(other, array);
      while (++index < arrLength) {
        var arrValue = array[index], othValue = other[index];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== void 0) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        if (seen) {
          if (!arraySome(other, function(othValue2, othIndex) {
            if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
            result = false;
            break;
          }
        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          result = false;
          break;
        }
      }
      stack["delete"](array);
      stack["delete"](other);
      return result;
    }
    module2.exports = equalArrays;
  }
});

// node_modules/lodash/_Uint8Array.js
var require_Uint8Array = __commonJS({
  "node_modules/lodash/_Uint8Array.js"(exports2, module2) {
    var root = require_root();
    var Uint8Array2 = root.Uint8Array;
    module2.exports = Uint8Array2;
  }
});

// node_modules/lodash/_mapToArray.js
var require_mapToArray = __commonJS({
  "node_modules/lodash/_mapToArray.js"(exports2, module2) {
    function mapToArray(map) {
      var index = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }
    module2.exports = mapToArray;
  }
});

// node_modules/lodash/_setToArray.js
var require_setToArray = __commonJS({
  "node_modules/lodash/_setToArray.js"(exports2, module2) {
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }
    module2.exports = setToArray;
  }
});

// node_modules/lodash/_equalByTag.js
var require_equalByTag = __commonJS({
  "node_modules/lodash/_equalByTag.js"(exports2, module2) {
    var Symbol2 = require_Symbol();
    var Uint8Array2 = require_Uint8Array();
    var eq = require_eq();
    var equalArrays = require_equalArrays();
    var mapToArray = require_mapToArray();
    var setToArray = require_setToArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;
        case arrayBufferTag:
          if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
            return false;
          }
          return true;
        case boolTag:
        case dateTag:
        case numberTag:
          return eq(+object, +other);
        case errorTag:
          return object.name == other.name && object.message == other.message;
        case regexpTag:
        case stringTag:
          return object == other + "";
        case mapTag:
          var convert = mapToArray;
        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);
          if (object.size != other.size && !isPartial) {
            return false;
          }
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack["delete"](object);
          return result;
        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }
    module2.exports = equalByTag;
  }
});

// node_modules/lodash/_arrayPush.js
var require_arrayPush = __commonJS({
  "node_modules/lodash/_arrayPush.js"(exports2, module2) {
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    module2.exports = arrayPush;
  }
});

// node_modules/lodash/isArray.js
var require_isArray = __commonJS({
  "node_modules/lodash/isArray.js"(exports2, module2) {
    var isArray = Array.isArray;
    module2.exports = isArray;
  }
});

// node_modules/lodash/_baseGetAllKeys.js
var require_baseGetAllKeys = __commonJS({
  "node_modules/lodash/_baseGetAllKeys.js"(exports2, module2) {
    var arrayPush = require_arrayPush();
    var isArray = require_isArray();
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }
    module2.exports = baseGetAllKeys;
  }
});

// node_modules/lodash/_arrayFilter.js
var require_arrayFilter = __commonJS({
  "node_modules/lodash/_arrayFilter.js"(exports2, module2) {
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    module2.exports = arrayFilter;
  }
});

// node_modules/lodash/stubArray.js
var require_stubArray = __commonJS({
  "node_modules/lodash/stubArray.js"(exports2, module2) {
    function stubArray() {
      return [];
    }
    module2.exports = stubArray;
  }
});

// node_modules/lodash/_getSymbols.js
var require_getSymbols = __commonJS({
  "node_modules/lodash/_getSymbols.js"(exports2, module2) {
    var arrayFilter = require_arrayFilter();
    var stubArray = require_stubArray();
    var objectProto = Object.prototype;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };
    module2.exports = getSymbols;
  }
});

// node_modules/lodash/_baseTimes.js
var require_baseTimes = __commonJS({
  "node_modules/lodash/_baseTimes.js"(exports2, module2) {
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    module2.exports = baseTimes;
  }
});

// node_modules/lodash/isObjectLike.js
var require_isObjectLike = __commonJS({
  "node_modules/lodash/isObjectLike.js"(exports2, module2) {
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    module2.exports = isObjectLike;
  }
});

// node_modules/lodash/_baseIsArguments.js
var require_baseIsArguments = __commonJS({
  "node_modules/lodash/_baseIsArguments.js"(exports2, module2) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }
    module2.exports = baseIsArguments;
  }
});

// node_modules/lodash/isArguments.js
var require_isArguments = __commonJS({
  "node_modules/lodash/isArguments.js"(exports2, module2) {
    var baseIsArguments = require_baseIsArguments();
    var isObjectLike = require_isObjectLike();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var isArguments = baseIsArguments(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
    };
    module2.exports = isArguments;
  }
});

// node_modules/lodash/stubFalse.js
var require_stubFalse = __commonJS({
  "node_modules/lodash/stubFalse.js"(exports2, module2) {
    function stubFalse() {
      return false;
    }
    module2.exports = stubFalse;
  }
});

// node_modules/lodash/isBuffer.js
var require_isBuffer = __commonJS({
  "node_modules/lodash/isBuffer.js"(exports2, module2) {
    var root = require_root();
    var stubFalse = require_stubFalse();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var Buffer2 = moduleExports ? root.Buffer : void 0;
    var nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0;
    var isBuffer = nativeIsBuffer || stubFalse;
    module2.exports = isBuffer;
  }
});

// node_modules/lodash/_isIndex.js
var require_isIndex = __commonJS({
  "node_modules/lodash/_isIndex.js"(exports2, module2) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    module2.exports = isIndex;
  }
});

// node_modules/lodash/isLength.js
var require_isLength = __commonJS({
  "node_modules/lodash/isLength.js"(exports2, module2) {
    var MAX_SAFE_INTEGER = 9007199254740991;
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    module2.exports = isLength;
  }
});

// node_modules/lodash/_baseIsTypedArray.js
var require_baseIsTypedArray = __commonJS({
  "node_modules/lodash/_baseIsTypedArray.js"(exports2, module2) {
    var baseGetTag = require_baseGetTag();
    var isLength = require_isLength();
    var isObjectLike = require_isObjectLike();
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var boolTag = "[object Boolean]";
    var dateTag = "[object Date]";
    var errorTag = "[object Error]";
    var funcTag = "[object Function]";
    var mapTag = "[object Map]";
    var numberTag = "[object Number]";
    var objectTag = "[object Object]";
    var regexpTag = "[object RegExp]";
    var setTag = "[object Set]";
    var stringTag = "[object String]";
    var weakMapTag = "[object WeakMap]";
    var arrayBufferTag = "[object ArrayBuffer]";
    var dataViewTag = "[object DataView]";
    var float32Tag = "[object Float32Array]";
    var float64Tag = "[object Float64Array]";
    var int8Tag = "[object Int8Array]";
    var int16Tag = "[object Int16Array]";
    var int32Tag = "[object Int32Array]";
    var uint8Tag = "[object Uint8Array]";
    var uint8ClampedTag = "[object Uint8ClampedArray]";
    var uint16Tag = "[object Uint16Array]";
    var uint32Tag = "[object Uint32Array]";
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }
    module2.exports = baseIsTypedArray;
  }
});

// node_modules/lodash/_baseUnary.js
var require_baseUnary = __commonJS({
  "node_modules/lodash/_baseUnary.js"(exports2, module2) {
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    module2.exports = baseUnary;
  }
});

// node_modules/lodash/_nodeUtil.js
var require_nodeUtil = __commonJS({
  "node_modules/lodash/_nodeUtil.js"(exports2, module2) {
    var freeGlobal = require_freeGlobal();
    var freeExports = typeof exports2 == "object" && exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && typeof module2 == "object" && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = (function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    })();
    module2.exports = nodeUtil;
  }
});

// node_modules/lodash/isTypedArray.js
var require_isTypedArray = __commonJS({
  "node_modules/lodash/isTypedArray.js"(exports2, module2) {
    var baseIsTypedArray = require_baseIsTypedArray();
    var baseUnary = require_baseUnary();
    var nodeUtil = require_nodeUtil();
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
    module2.exports = isTypedArray;
  }
});

// node_modules/lodash/_arrayLikeKeys.js
var require_arrayLikeKeys = __commonJS({
  "node_modules/lodash/_arrayLikeKeys.js"(exports2, module2) {
    var baseTimes = require_baseTimes();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isIndex = require_isIndex();
    var isTypedArray = require_isTypedArray();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
        (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
        isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = arrayLikeKeys;
  }
});

// node_modules/lodash/_isPrototype.js
var require_isPrototype = __commonJS({
  "node_modules/lodash/_isPrototype.js"(exports2, module2) {
    var objectProto = Object.prototype;
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    module2.exports = isPrototype;
  }
});

// node_modules/lodash/_overArg.js
var require_overArg = __commonJS({
  "node_modules/lodash/_overArg.js"(exports2, module2) {
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    module2.exports = overArg;
  }
});

// node_modules/lodash/_nativeKeys.js
var require_nativeKeys = __commonJS({
  "node_modules/lodash/_nativeKeys.js"(exports2, module2) {
    var overArg = require_overArg();
    var nativeKeys = overArg(Object.keys, Object);
    module2.exports = nativeKeys;
  }
});

// node_modules/lodash/_baseKeys.js
var require_baseKeys = __commonJS({
  "node_modules/lodash/_baseKeys.js"(exports2, module2) {
    var isPrototype = require_isPrototype();
    var nativeKeys = require_nativeKeys();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = baseKeys;
  }
});

// node_modules/lodash/isArrayLike.js
var require_isArrayLike = __commonJS({
  "node_modules/lodash/isArrayLike.js"(exports2, module2) {
    var isFunction = require_isFunction();
    var isLength = require_isLength();
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    module2.exports = isArrayLike;
  }
});

// node_modules/lodash/keys.js
var require_keys = __commonJS({
  "node_modules/lodash/keys.js"(exports2, module2) {
    var arrayLikeKeys = require_arrayLikeKeys();
    var baseKeys = require_baseKeys();
    var isArrayLike = require_isArrayLike();
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    module2.exports = keys;
  }
});

// node_modules/lodash/_getAllKeys.js
var require_getAllKeys = __commonJS({
  "node_modules/lodash/_getAllKeys.js"(exports2, module2) {
    var baseGetAllKeys = require_baseGetAllKeys();
    var getSymbols = require_getSymbols();
    var keys = require_keys();
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }
    module2.exports = getAllKeys;
  }
});

// node_modules/lodash/_equalObjects.js
var require_equalObjects = __commonJS({
  "node_modules/lodash/_equalObjects.js"(exports2, module2) {
    var getAllKeys = require_getAllKeys();
    var COMPARE_PARTIAL_FLAG = 1;
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      var objStacked = stack.get(object);
      var othStacked = stack.get(other);
      if (objStacked && othStacked) {
        return objStacked == other && othStacked == object;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);
      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key], othValue = other[key];
        if (customizer) {
          var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
        }
        if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == "constructor");
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor, othCtor = other.constructor;
        if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack["delete"](object);
      stack["delete"](other);
      return result;
    }
    module2.exports = equalObjects;
  }
});

// node_modules/lodash/_DataView.js
var require_DataView = __commonJS({
  "node_modules/lodash/_DataView.js"(exports2, module2) {
    var getNative = require_getNative();
    var root = require_root();
    var DataView = getNative(root, "DataView");
    module2.exports = DataView;
  }
});

// node_modules/lodash/_Promise.js
var require_Promise = __commonJS({
  "node_modules/lodash/_Promise.js"(exports2, module2) {
    var getNative = require_getNative();
    var root = require_root();
    var Promise2 = getNative(root, "Promise");
    module2.exports = Promise2;
  }
});

// node_modules/lodash/_Set.js
var require_Set = __commonJS({
  "node_modules/lodash/_Set.js"(exports2, module2) {
    var getNative = require_getNative();
    var root = require_root();
    var Set = getNative(root, "Set");
    module2.exports = Set;
  }
});

// node_modules/lodash/_WeakMap.js
var require_WeakMap = __commonJS({
  "node_modules/lodash/_WeakMap.js"(exports2, module2) {
    var getNative = require_getNative();
    var root = require_root();
    var WeakMap = getNative(root, "WeakMap");
    module2.exports = WeakMap;
  }
});

// node_modules/lodash/_getTag.js
var require_getTag = __commonJS({
  "node_modules/lodash/_getTag.js"(exports2, module2) {
    var DataView = require_DataView();
    var Map2 = require_Map();
    var Promise2 = require_Promise();
    var Set = require_Set();
    var WeakMap = require_WeakMap();
    var baseGetTag = require_baseGetTag();
    var toSource = require_toSource();
    var mapTag = "[object Map]";
    var objectTag = "[object Object]";
    var promiseTag = "[object Promise]";
    var setTag = "[object Set]";
    var weakMapTag = "[object WeakMap]";
    var dataViewTag = "[object DataView]";
    var dataViewCtorString = toSource(DataView);
    var mapCtorString = toSource(Map2);
    var promiseCtorString = toSource(Promise2);
    var setCtorString = toSource(Set);
    var weakMapCtorString = toSource(WeakMap);
    var getTag = baseGetTag;
    if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
      getTag = function(value) {
        var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString:
              return dataViewTag;
            case mapCtorString:
              return mapTag;
            case promiseCtorString:
              return promiseTag;
            case setCtorString:
              return setTag;
            case weakMapCtorString:
              return weakMapTag;
          }
        }
        return result;
      };
    }
    module2.exports = getTag;
  }
});

// node_modules/lodash/_baseIsEqualDeep.js
var require_baseIsEqualDeep = __commonJS({
  "node_modules/lodash/_baseIsEqualDeep.js"(exports2, module2) {
    var Stack = require_Stack();
    var equalArrays = require_equalArrays();
    var equalByTag = require_equalByTag();
    var equalObjects = require_equalObjects();
    var getTag = require_getTag();
    var isArray = require_isArray();
    var isBuffer = require_isBuffer();
    var isTypedArray = require_isTypedArray();
    var COMPARE_PARTIAL_FLAG = 1;
    var argsTag = "[object Arguments]";
    var arrayTag = "[object Array]";
    var objectTag = "[object Object]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;
      var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack());
        return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
          stack || (stack = new Stack());
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack());
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }
    module2.exports = baseIsEqualDeep;
  }
});

// node_modules/lodash/_baseIsEqual.js
var require_baseIsEqual = __commonJS({
  "node_modules/lodash/_baseIsEqual.js"(exports2, module2) {
    var baseIsEqualDeep = require_baseIsEqualDeep();
    var isObjectLike = require_isObjectLike();
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }
    module2.exports = baseIsEqual;
  }
});

// node_modules/lodash/_baseIsMatch.js
var require_baseIsMatch = __commonJS({
  "node_modules/lodash/_baseIsMatch.js"(exports2, module2) {
    var Stack = require_Stack();
    var baseIsEqual = require_baseIsEqual();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length, length = index, noCustomizer = !customizer;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0], objValue = object[key], srcValue = data[1];
        if (noCustomizer && data[2]) {
          if (objValue === void 0 && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack();
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === void 0 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result)) {
            return false;
          }
        }
      }
      return true;
    }
    module2.exports = baseIsMatch;
  }
});

// node_modules/lodash/_isStrictComparable.js
var require_isStrictComparable = __commonJS({
  "node_modules/lodash/_isStrictComparable.js"(exports2, module2) {
    var isObject = require_isObject();
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }
    module2.exports = isStrictComparable;
  }
});

// node_modules/lodash/_getMatchData.js
var require_getMatchData = __commonJS({
  "node_modules/lodash/_getMatchData.js"(exports2, module2) {
    var isStrictComparable = require_isStrictComparable();
    var keys = require_keys();
    function getMatchData(object) {
      var result = keys(object), length = result.length;
      while (length--) {
        var key = result[length], value = object[key];
        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }
    module2.exports = getMatchData;
  }
});

// node_modules/lodash/_matchesStrictComparable.js
var require_matchesStrictComparable = __commonJS({
  "node_modules/lodash/_matchesStrictComparable.js"(exports2, module2) {
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue && (srcValue !== void 0 || key in Object(object));
      };
    }
    module2.exports = matchesStrictComparable;
  }
});

// node_modules/lodash/_baseMatches.js
var require_baseMatches = __commonJS({
  "node_modules/lodash/_baseMatches.js"(exports2, module2) {
    var baseIsMatch = require_baseIsMatch();
    var getMatchData = require_getMatchData();
    var matchesStrictComparable = require_matchesStrictComparable();
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }
    module2.exports = baseMatches;
  }
});

// node_modules/lodash/isSymbol.js
var require_isSymbol = __commonJS({
  "node_modules/lodash/isSymbol.js"(exports2, module2) {
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module2.exports = isSymbol;
  }
});

// node_modules/lodash/_isKey.js
var require_isKey = __commonJS({
  "node_modules/lodash/_isKey.js"(exports2, module2) {
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
    var reIsPlainProp = /^\w*$/;
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
    }
    module2.exports = isKey;
  }
});

// node_modules/lodash/memoize.js
var require_memoize = __commonJS({
  "node_modules/lodash/memoize.js"(exports2, module2) {
    var MapCache = require_MapCache();
    var FUNC_ERROR_TEXT = "Expected a function";
    function memoize(func, resolver) {
      if (typeof func != "function" || resolver != null && typeof resolver != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache)();
      return memoized;
    }
    memoize.Cache = MapCache;
    module2.exports = memoize;
  }
});

// node_modules/lodash/_memoizeCapped.js
var require_memoizeCapped = __commonJS({
  "node_modules/lodash/_memoizeCapped.js"(exports2, module2) {
    var memoize = require_memoize();
    var MAX_MEMOIZE_SIZE = 500;
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });
      var cache = result.cache;
      return result;
    }
    module2.exports = memoizeCapped;
  }
});

// node_modules/lodash/_stringToPath.js
var require_stringToPath = __commonJS({
  "node_modules/lodash/_stringToPath.js"(exports2, module2) {
    var memoizeCapped = require_memoizeCapped();
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46) {
        result.push("");
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
      });
      return result;
    });
    module2.exports = stringToPath;
  }
});

// node_modules/lodash/_arrayMap.js
var require_arrayMap = __commonJS({
  "node_modules/lodash/_arrayMap.js"(exports2, module2) {
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    module2.exports = arrayMap;
  }
});

// node_modules/lodash/_baseToString.js
var require_baseToString = __commonJS({
  "node_modules/lodash/_baseToString.js"(exports2, module2) {
    var Symbol2 = require_Symbol();
    var arrayMap = require_arrayMap();
    var isArray = require_isArray();
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
    var symbolToString = symbolProto ? symbolProto.toString : void 0;
    function baseToString(value) {
      if (typeof value == "string") {
        return value;
      }
      if (isArray(value)) {
        return arrayMap(value, baseToString) + "";
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : "";
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module2.exports = baseToString;
  }
});

// node_modules/lodash/toString.js
var require_toString = __commonJS({
  "node_modules/lodash/toString.js"(exports2, module2) {
    var baseToString = require_baseToString();
    function toString(value) {
      return value == null ? "" : baseToString(value);
    }
    module2.exports = toString;
  }
});

// node_modules/lodash/_castPath.js
var require_castPath = __commonJS({
  "node_modules/lodash/_castPath.js"(exports2, module2) {
    var isArray = require_isArray();
    var isKey = require_isKey();
    var stringToPath = require_stringToPath();
    var toString = require_toString();
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }
    module2.exports = castPath;
  }
});

// node_modules/lodash/_toKey.js
var require_toKey = __commonJS({
  "node_modules/lodash/_toKey.js"(exports2, module2) {
    var isSymbol = require_isSymbol();
    var INFINITY = 1 / 0;
    function toKey(value) {
      if (typeof value == "string" || isSymbol(value)) {
        return value;
      }
      var result = value + "";
      return result == "0" && 1 / value == -INFINITY ? "-0" : result;
    }
    module2.exports = toKey;
  }
});

// node_modules/lodash/_baseGet.js
var require_baseGet = __commonJS({
  "node_modules/lodash/_baseGet.js"(exports2, module2) {
    var castPath = require_castPath();
    var toKey = require_toKey();
    function baseGet(object, path) {
      path = castPath(path, object);
      var index = 0, length = path.length;
      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return index && index == length ? object : void 0;
    }
    module2.exports = baseGet;
  }
});

// node_modules/lodash/get.js
var require_get = __commonJS({
  "node_modules/lodash/get.js"(exports2, module2) {
    var baseGet = require_baseGet();
    function get(object, path, defaultValue) {
      var result = object == null ? void 0 : baseGet(object, path);
      return result === void 0 ? defaultValue : result;
    }
    module2.exports = get;
  }
});

// node_modules/lodash/_baseHasIn.js
var require_baseHasIn = __commonJS({
  "node_modules/lodash/_baseHasIn.js"(exports2, module2) {
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }
    module2.exports = baseHasIn;
  }
});

// node_modules/lodash/_hasPath.js
var require_hasPath = __commonJS({
  "node_modules/lodash/_hasPath.js"(exports2, module2) {
    var castPath = require_castPath();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isIndex = require_isIndex();
    var isLength = require_isLength();
    var toKey = require_toKey();
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);
      var index = -1, length = path.length, result = false;
      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
    }
    module2.exports = hasPath;
  }
});

// node_modules/lodash/hasIn.js
var require_hasIn = __commonJS({
  "node_modules/lodash/hasIn.js"(exports2, module2) {
    var baseHasIn = require_baseHasIn();
    var hasPath = require_hasPath();
    function hasIn(object, path) {
      return object != null && hasPath(object, path, baseHasIn);
    }
    module2.exports = hasIn;
  }
});

// node_modules/lodash/_baseMatchesProperty.js
var require_baseMatchesProperty = __commonJS({
  "node_modules/lodash/_baseMatchesProperty.js"(exports2, module2) {
    var baseIsEqual = require_baseIsEqual();
    var get = require_get();
    var hasIn = require_hasIn();
    var isKey = require_isKey();
    var isStrictComparable = require_isStrictComparable();
    var matchesStrictComparable = require_matchesStrictComparable();
    var toKey = require_toKey();
    var COMPARE_PARTIAL_FLAG = 1;
    var COMPARE_UNORDERED_FLAG = 2;
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return objValue === void 0 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }
    module2.exports = baseMatchesProperty;
  }
});

// node_modules/lodash/identity.js
var require_identity = __commonJS({
  "node_modules/lodash/identity.js"(exports2, module2) {
    function identity(value) {
      return value;
    }
    module2.exports = identity;
  }
});

// node_modules/lodash/_baseProperty.js
var require_baseProperty = __commonJS({
  "node_modules/lodash/_baseProperty.js"(exports2, module2) {
    function baseProperty(key) {
      return function(object) {
        return object == null ? void 0 : object[key];
      };
    }
    module2.exports = baseProperty;
  }
});

// node_modules/lodash/_basePropertyDeep.js
var require_basePropertyDeep = __commonJS({
  "node_modules/lodash/_basePropertyDeep.js"(exports2, module2) {
    var baseGet = require_baseGet();
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }
    module2.exports = basePropertyDeep;
  }
});

// node_modules/lodash/property.js
var require_property = __commonJS({
  "node_modules/lodash/property.js"(exports2, module2) {
    var baseProperty = require_baseProperty();
    var basePropertyDeep = require_basePropertyDeep();
    var isKey = require_isKey();
    var toKey = require_toKey();
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }
    module2.exports = property;
  }
});

// node_modules/lodash/_baseIteratee.js
var require_baseIteratee = __commonJS({
  "node_modules/lodash/_baseIteratee.js"(exports2, module2) {
    var baseMatches = require_baseMatches();
    var baseMatchesProperty = require_baseMatchesProperty();
    var identity = require_identity();
    var isArray = require_isArray();
    var property = require_property();
    function baseIteratee(value) {
      if (typeof value == "function") {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == "object") {
        return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
      }
      return property(value);
    }
    module2.exports = baseIteratee;
  }
});

// node_modules/lodash/_createFind.js
var require_createFind = __commonJS({
  "node_modules/lodash/_createFind.js"(exports2, module2) {
    var baseIteratee = require_baseIteratee();
    var isArrayLike = require_isArrayLike();
    var keys = require_keys();
    function createFind(findIndexFunc) {
      return function(collection, predicate, fromIndex) {
        var iterable = Object(collection);
        if (!isArrayLike(collection)) {
          var iteratee = baseIteratee(predicate, 3);
          collection = keys(collection);
          predicate = function(key) {
            return iteratee(iterable[key], key, iterable);
          };
        }
        var index = findIndexFunc(collection, predicate, fromIndex);
        return index > -1 ? iterable[iteratee ? collection[index] : index] : void 0;
      };
    }
    module2.exports = createFind;
  }
});

// node_modules/lodash/_baseFindIndex.js
var require_baseFindIndex = __commonJS({
  "node_modules/lodash/_baseFindIndex.js"(exports2, module2) {
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    module2.exports = baseFindIndex;
  }
});

// node_modules/lodash/_trimmedEndIndex.js
var require_trimmedEndIndex = __commonJS({
  "node_modules/lodash/_trimmedEndIndex.js"(exports2, module2) {
    var reWhitespace = /\s/;
    function trimmedEndIndex(string) {
      var index = string.length;
      while (index-- && reWhitespace.test(string.charAt(index))) {
      }
      return index;
    }
    module2.exports = trimmedEndIndex;
  }
});

// node_modules/lodash/_baseTrim.js
var require_baseTrim = __commonJS({
  "node_modules/lodash/_baseTrim.js"(exports2, module2) {
    var trimmedEndIndex = require_trimmedEndIndex();
    var reTrimStart = /^\s+/;
    function baseTrim(string) {
      return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
    }
    module2.exports = baseTrim;
  }
});

// node_modules/lodash/toNumber.js
var require_toNumber = __commonJS({
  "node_modules/lodash/toNumber.js"(exports2, module2) {
    var baseTrim = require_baseTrim();
    var isObject = require_isObject();
    var isSymbol = require_isSymbol();
    var NAN = 0 / 0;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = baseTrim(value);
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module2.exports = toNumber;
  }
});

// node_modules/lodash/toFinite.js
var require_toFinite = __commonJS({
  "node_modules/lodash/toFinite.js"(exports2, module2) {
    var toNumber = require_toNumber();
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    module2.exports = toFinite;
  }
});

// node_modules/lodash/toInteger.js
var require_toInteger = __commonJS({
  "node_modules/lodash/toInteger.js"(exports2, module2) {
    var toFinite = require_toFinite();
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    module2.exports = toInteger;
  }
});

// node_modules/lodash/findIndex.js
var require_findIndex = __commonJS({
  "node_modules/lodash/findIndex.js"(exports2, module2) {
    var baseFindIndex = require_baseFindIndex();
    var baseIteratee = require_baseIteratee();
    var toInteger = require_toInteger();
    var nativeMax = Math.max;
    function findIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseFindIndex(array, baseIteratee(predicate, 3), index);
    }
    module2.exports = findIndex;
  }
});

// node_modules/lodash/find.js
var require_find = __commonJS({
  "node_modules/lodash/find.js"(exports2, module2) {
    var createFind = require_createFind();
    var findIndex = require_findIndex();
    var find = createFind(findIndex);
    module2.exports = find;
  }
});

// node_modules/lodash/isEmpty.js
var require_isEmpty = __commonJS({
  "node_modules/lodash/isEmpty.js"(exports2, module2) {
    var baseKeys = require_baseKeys();
    var getTag = require_getTag();
    var isArguments = require_isArguments();
    var isArray = require_isArray();
    var isArrayLike = require_isArrayLike();
    var isBuffer = require_isBuffer();
    var isPrototype = require_isPrototype();
    var isTypedArray = require_isTypedArray();
    var mapTag = "[object Map]";
    var setTag = "[object Set]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) {
        return !value.length;
      }
      var tag = getTag(value);
      if (tag == mapTag || tag == setTag) {
        return !value.size;
      }
      if (isPrototype(value)) {
        return !baseKeys(value).length;
      }
      for (var key in value) {
        if (hasOwnProperty.call(value, key)) {
          return false;
        }
      }
      return true;
    }
    module2.exports = isEmpty;
  }
});

// node_modules/lodash/_defineProperty.js
var require_defineProperty = __commonJS({
  "node_modules/lodash/_defineProperty.js"(exports2, module2) {
    var getNative = require_getNative();
    var defineProperty = (function() {
      try {
        var func = getNative(Object, "defineProperty");
        func({}, "", {});
        return func;
      } catch (e) {
      }
    })();
    module2.exports = defineProperty;
  }
});

// node_modules/lodash/_baseAssignValue.js
var require_baseAssignValue = __commonJS({
  "node_modules/lodash/_baseAssignValue.js"(exports2, module2) {
    var defineProperty = require_defineProperty();
    function baseAssignValue(object, key, value) {
      if (key == "__proto__" && defineProperty) {
        defineProperty(object, key, {
          "configurable": true,
          "enumerable": true,
          "value": value,
          "writable": true
        });
      } else {
        object[key] = value;
      }
    }
    module2.exports = baseAssignValue;
  }
});

// node_modules/lodash/_assignValue.js
var require_assignValue = __commonJS({
  "node_modules/lodash/_assignValue.js"(exports2, module2) {
    var baseAssignValue = require_baseAssignValue();
    var eq = require_eq();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
        baseAssignValue(object, key, value);
      }
    }
    module2.exports = assignValue;
  }
});

// node_modules/lodash/_baseSet.js
var require_baseSet = __commonJS({
  "node_modules/lodash/_baseSet.js"(exports2, module2) {
    var assignValue = require_assignValue();
    var castPath = require_castPath();
    var isIndex = require_isIndex();
    var isObject = require_isObject();
    var toKey = require_toKey();
    function baseSet(object, path, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path = castPath(path, object);
      var index = -1, length = path.length, lastIndex = length - 1, nested = object;
      while (nested != null && ++index < length) {
        var key = toKey(path[index]), newValue = value;
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          return object;
        }
        if (index != lastIndex) {
          var objValue = nested[key];
          newValue = customizer ? customizer(objValue, key, nested) : void 0;
          if (newValue === void 0) {
            newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }
    module2.exports = baseSet;
  }
});

// node_modules/lodash/_basePickBy.js
var require_basePickBy = __commonJS({
  "node_modules/lodash/_basePickBy.js"(exports2, module2) {
    var baseGet = require_baseGet();
    var baseSet = require_baseSet();
    var castPath = require_castPath();
    function basePickBy(object, paths, predicate) {
      var index = -1, length = paths.length, result = {};
      while (++index < length) {
        var path = paths[index], value = baseGet(object, path);
        if (predicate(value, path)) {
          baseSet(result, castPath(path, object), value);
        }
      }
      return result;
    }
    module2.exports = basePickBy;
  }
});

// node_modules/lodash/_getPrototype.js
var require_getPrototype = __commonJS({
  "node_modules/lodash/_getPrototype.js"(exports2, module2) {
    var overArg = require_overArg();
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    module2.exports = getPrototype;
  }
});

// node_modules/lodash/_getSymbolsIn.js
var require_getSymbolsIn = __commonJS({
  "node_modules/lodash/_getSymbolsIn.js"(exports2, module2) {
    var arrayPush = require_arrayPush();
    var getPrototype = require_getPrototype();
    var getSymbols = require_getSymbols();
    var stubArray = require_stubArray();
    var nativeGetSymbols = Object.getOwnPropertySymbols;
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
      }
      return result;
    };
    module2.exports = getSymbolsIn;
  }
});

// node_modules/lodash/_nativeKeysIn.js
var require_nativeKeysIn = __commonJS({
  "node_modules/lodash/_nativeKeysIn.js"(exports2, module2) {
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = nativeKeysIn;
  }
});

// node_modules/lodash/_baseKeysIn.js
var require_baseKeysIn = __commonJS({
  "node_modules/lodash/_baseKeysIn.js"(exports2, module2) {
    var isObject = require_isObject();
    var isPrototype = require_isPrototype();
    var nativeKeysIn = require_nativeKeysIn();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object), result = [];
      for (var key in object) {
        if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }
    module2.exports = baseKeysIn;
  }
});

// node_modules/lodash/keysIn.js
var require_keysIn = __commonJS({
  "node_modules/lodash/keysIn.js"(exports2, module2) {
    var arrayLikeKeys = require_arrayLikeKeys();
    var baseKeysIn = require_baseKeysIn();
    var isArrayLike = require_isArrayLike();
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }
    module2.exports = keysIn;
  }
});

// node_modules/lodash/_getAllKeysIn.js
var require_getAllKeysIn = __commonJS({
  "node_modules/lodash/_getAllKeysIn.js"(exports2, module2) {
    var baseGetAllKeys = require_baseGetAllKeys();
    var getSymbolsIn = require_getSymbolsIn();
    var keysIn = require_keysIn();
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn);
    }
    module2.exports = getAllKeysIn;
  }
});

// node_modules/lodash/pickBy.js
var require_pickBy = __commonJS({
  "node_modules/lodash/pickBy.js"(exports2, module2) {
    var arrayMap = require_arrayMap();
    var baseIteratee = require_baseIteratee();
    var basePickBy = require_basePickBy();
    var getAllKeysIn = require_getAllKeysIn();
    function pickBy(object, predicate) {
      if (object == null) {
        return {};
      }
      var props = arrayMap(getAllKeysIn(object), function(prop) {
        return [prop];
      });
      predicate = baseIteratee(predicate);
      return basePickBy(object, props, function(value, path) {
        return predicate(value, path[0]);
      });
    }
    module2.exports = pickBy;
  }
});

// node_modules/strip-ansi/node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS({
  "node_modules/strip-ansi/node_modules/ansi-regex/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (options) => {
      options = Object.assign({
        onlyFirst: false
      }, options);
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, options.onlyFirst ? void 0 : "g");
    };
  }
});

// node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS({
  "node_modules/strip-ansi/index.js"(exports2, module2) {
    "use strict";
    var ansiRegex = require_ansi_regex();
    var stripAnsi2 = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
    module2.exports = stripAnsi2;
    module2.exports.default = stripAnsi2;
  }
});

// node_modules/ansi-regex/index.js
var require_ansi_regex2 = __commonJS({
  "node_modules/ansi-regex/index.js"(exports2, module2) {
    "use strict";
    module2.exports = () => {
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[a-zA-Z\\d]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, "g");
    };
  }
});

// node_modules/has-ansi/index.js
var require_has_ansi = __commonJS({
  "node_modules/has-ansi/index.js"(exports2, module2) {
    "use strict";
    var ansiRegex = require_ansi_regex2();
    var re = new RegExp(ansiRegex().source);
    module2.exports = (input) => re.test(input);
  }
});

// node_modules/iserror/index.js
var require_iserror = __commonJS({
  "node_modules/iserror/index.js"(exports2, module2) {
    module2.exports = isError;
    function isError(value) {
      switch (Object.prototype.toString.call(value)) {
        case "[object Error]":
          return true;
        case "[object Exception]":
          return true;
        case "[object DOMException]":
          return true;
        default:
          return value instanceof Error;
      }
    }
  }
});

// node_modules/stackframe/stackframe.js
var require_stackframe = __commonJS({
  "node_modules/stackframe/stackframe.js"(exports2, module2) {
    (function(root, factory) {
      "use strict";
      if (typeof define === "function" && define.amd) {
        define("stackframe", [], factory);
      } else if (typeof exports2 === "object") {
        module2.exports = factory();
      } else {
        root.StackFrame = factory();
      }
    })(exports2, function() {
      "use strict";
      function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }
      function _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
      }
      function _getter(p) {
        return function() {
          return this[p];
        };
      }
      var booleanProps = ["isConstructor", "isEval", "isNative", "isToplevel"];
      var numericProps = ["columnNumber", "lineNumber"];
      var stringProps = ["fileName", "functionName", "source"];
      var arrayProps = ["args"];
      var objectProps = ["evalOrigin"];
      var props = booleanProps.concat(numericProps, stringProps, arrayProps, objectProps);
      function StackFrame(obj) {
        if (!obj) return;
        for (var i2 = 0; i2 < props.length; i2++) {
          if (obj[props[i2]] !== void 0) {
            this["set" + _capitalize(props[i2])](obj[props[i2]]);
          }
        }
      }
      StackFrame.prototype = {
        getArgs: function() {
          return this.args;
        },
        setArgs: function(v) {
          if (Object.prototype.toString.call(v) !== "[object Array]") {
            throw new TypeError("Args must be an Array");
          }
          this.args = v;
        },
        getEvalOrigin: function() {
          return this.evalOrigin;
        },
        setEvalOrigin: function(v) {
          if (v instanceof StackFrame) {
            this.evalOrigin = v;
          } else if (v instanceof Object) {
            this.evalOrigin = new StackFrame(v);
          } else {
            throw new TypeError("Eval Origin must be an Object or StackFrame");
          }
        },
        toString: function() {
          var fileName = this.getFileName() || "";
          var lineNumber = this.getLineNumber() || "";
          var columnNumber = this.getColumnNumber() || "";
          var functionName = this.getFunctionName() || "";
          if (this.getIsEval()) {
            if (fileName) {
              return "[eval] (" + fileName + ":" + lineNumber + ":" + columnNumber + ")";
            }
            return "[eval]:" + lineNumber + ":" + columnNumber;
          }
          if (functionName) {
            return functionName + " (" + fileName + ":" + lineNumber + ":" + columnNumber + ")";
          }
          return fileName + ":" + lineNumber + ":" + columnNumber;
        }
      };
      StackFrame.fromString = function StackFrame$$fromString(str) {
        var argsStartIndex = str.indexOf("(");
        var argsEndIndex = str.lastIndexOf(")");
        var functionName = str.substring(0, argsStartIndex);
        var args = str.substring(argsStartIndex + 1, argsEndIndex).split(",");
        var locationString = str.substring(argsEndIndex + 1);
        if (locationString.indexOf("@") === 0) {
          var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, "");
          var fileName = parts[1];
          var lineNumber = parts[2];
          var columnNumber = parts[3];
        }
        return new StackFrame({
          functionName,
          args: args || void 0,
          fileName,
          lineNumber: lineNumber || void 0,
          columnNumber: columnNumber || void 0
        });
      };
      for (var i = 0; i < booleanProps.length; i++) {
        StackFrame.prototype["get" + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
        StackFrame.prototype["set" + _capitalize(booleanProps[i])] = /* @__PURE__ */ (function(p) {
          return function(v) {
            this[p] = Boolean(v);
          };
        })(booleanProps[i]);
      }
      for (var j = 0; j < numericProps.length; j++) {
        StackFrame.prototype["get" + _capitalize(numericProps[j])] = _getter(numericProps[j]);
        StackFrame.prototype["set" + _capitalize(numericProps[j])] = /* @__PURE__ */ (function(p) {
          return function(v) {
            if (!_isNumber(v)) {
              throw new TypeError(p + " must be a Number");
            }
            this[p] = Number(v);
          };
        })(numericProps[j]);
      }
      for (var k = 0; k < stringProps.length; k++) {
        StackFrame.prototype["get" + _capitalize(stringProps[k])] = _getter(stringProps[k]);
        StackFrame.prototype["set" + _capitalize(stringProps[k])] = /* @__PURE__ */ (function(p) {
          return function(v) {
            this[p] = String(v);
          };
        })(stringProps[k]);
      }
      return StackFrame;
    });
  }
});

// node_modules/error-stack-parser/error-stack-parser.js
var require_error_stack_parser = __commonJS({
  "node_modules/error-stack-parser/error-stack-parser.js"(exports2, module2) {
    (function(root, factory) {
      "use strict";
      if (typeof define === "function" && define.amd) {
        define("error-stack-parser", ["stackframe"], factory);
      } else if (typeof exports2 === "object") {
        module2.exports = factory(require_stackframe());
      } else {
        root.ErrorStackParser = factory(root.StackFrame);
      }
    })(exports2, function ErrorStackParser(StackFrame) {
      "use strict";
      var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
      var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
      var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;
      return {
        /**
         * Given an Error object, extract the most information from it.
         *
         * @param {Error} error object
         * @return {Array} of StackFrames
         */
        parse: function ErrorStackParser$$parse(error) {
          if (typeof error.stacktrace !== "undefined" || typeof error["opera#sourceloc"] !== "undefined") {
            return this.parseOpera(error);
          } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
            return this.parseV8OrIE(error);
          } else if (error.stack) {
            return this.parseFFOrSafari(error);
          } else {
            throw new Error("Cannot parse given Error object");
          }
        },
        // Separate line and column numbers from a string of the form: (URI:Line:Column)
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
          if (urlLike.indexOf(":") === -1) {
            return [urlLike];
          }
          var regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
          var parts = regExp.exec(urlLike.replace(/[()]/g, ""));
          return [parts[1], parts[2] || void 0, parts[3] || void 0];
        },
        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
          var filtered = error.stack.split("\n").filter(function(line) {
            return !!line.match(CHROME_IE_STACK_REGEXP);
          }, this);
          return filtered.map(function(line) {
            if (line.indexOf("(eval ") > -1) {
              line = line.replace(/eval code/g, "eval").replace(/(\(eval at [^()]*)|(,.*$)/g, "");
            }
            var sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(").replace(/^.*?\s+/, "");
            var location = sanitizedLine.match(/ (\(.+\)$)/);
            sanitizedLine = location ? sanitizedLine.replace(location[0], "") : sanitizedLine;
            var locationParts = this.extractLocation(location ? location[1] : sanitizedLine);
            var functionName = location && sanitizedLine || void 0;
            var fileName = ["eval", "<anonymous>"].indexOf(locationParts[0]) > -1 ? void 0 : locationParts[0];
            return new StackFrame({
              functionName,
              fileName,
              lineNumber: locationParts[1],
              columnNumber: locationParts[2],
              source: line
            });
          }, this);
        },
        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
          var filtered = error.stack.split("\n").filter(function(line) {
            return !line.match(SAFARI_NATIVE_CODE_REGEXP);
          }, this);
          return filtered.map(function(line) {
            if (line.indexOf(" > eval") > -1) {
              line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ":$1");
            }
            if (line.indexOf("@") === -1 && line.indexOf(":") === -1) {
              return new StackFrame({
                functionName: line
              });
            } else {
              var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
              var matches = line.match(functionNameRegex);
              var functionName = matches && matches[1] ? matches[1] : void 0;
              var locationParts = this.extractLocation(line.replace(functionNameRegex, ""));
              return new StackFrame({
                functionName,
                fileName: locationParts[0],
                lineNumber: locationParts[1],
                columnNumber: locationParts[2],
                source: line
              });
            }
          }, this);
        },
        parseOpera: function ErrorStackParser$$parseOpera(e) {
          if (!e.stacktrace || e.message.indexOf("\n") > -1 && e.message.split("\n").length > e.stacktrace.split("\n").length) {
            return this.parseOpera9(e);
          } else if (!e.stack) {
            return this.parseOpera10(e);
          } else {
            return this.parseOpera11(e);
          }
        },
        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
          var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
          var lines = e.message.split("\n");
          var result = [];
          for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
              result.push(new StackFrame({
                fileName: match[2],
                lineNumber: match[1],
                source: lines[i]
              }));
            }
          }
          return result;
        },
        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
          var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
          var lines = e.stacktrace.split("\n");
          var result = [];
          for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRE.exec(lines[i]);
            if (match) {
              result.push(
                new StackFrame({
                  functionName: match[3] || void 0,
                  fileName: match[2],
                  lineNumber: match[1],
                  source: lines[i]
                })
              );
            }
          }
          return result;
        },
        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
          var filtered = error.stack.split("\n").filter(function(line) {
            return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
          }, this);
          return filtered.map(function(line) {
            var tokens = line.split("@");
            var locationParts = this.extractLocation(tokens.pop());
            var functionCall = tokens.shift() || "";
            var functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, "$2").replace(/\([^)]*\)/g, "") || void 0;
            var argsRaw;
            if (functionCall.match(/\(([^)]*)\)/)) {
              argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, "$1");
            }
            var args = argsRaw === void 0 || argsRaw === "[arguments not available]" ? void 0 : argsRaw.split(",");
            return new StackFrame({
              functionName,
              args,
              fileName: locationParts[0],
              lineNumber: locationParts[1],
              columnNumber: locationParts[2],
              source: line
            });
          }, this);
        }
      };
    });
  }
});

// node_modules/stack-generator/stack-generator.js
var require_stack_generator = __commonJS({
  "node_modules/stack-generator/stack-generator.js"(exports2, module2) {
    (function(root, factory) {
      "use strict";
      if (typeof define === "function" && define.amd) {
        define("stack-generator", ["stackframe"], factory);
      } else if (typeof exports2 === "object") {
        module2.exports = factory(require_stackframe());
      } else {
        root.StackGenerator = factory(root.StackFrame);
      }
    })(exports2, function(StackFrame) {
      return {
        backtrace: function StackGenerator$$backtrace(opts) {
          var stack = [];
          var maxStackSize = 10;
          if (typeof opts === "object" && typeof opts.maxStackSize === "number") {
            maxStackSize = opts.maxStackSize;
          }
          var curr = arguments.callee;
          while (curr && stack.length < maxStackSize && curr["arguments"]) {
            var args = new Array(curr["arguments"].length);
            for (var i = 0; i < args.length; ++i) {
              args[i] = curr["arguments"][i];
            }
            if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
              stack.push(new StackFrame({ functionName: RegExp.$1 || void 0, args }));
            } else {
              stack.push(new StackFrame({ args }));
            }
            try {
              curr = curr.caller;
            } catch (e) {
              break;
            }
          }
          return stack;
        }
      };
    });
  }
});

// node_modules/wrappy/wrappy.js
var require_wrappy = __commonJS({
  "node_modules/wrappy/wrappy.js"(exports2, module2) {
    module2.exports = wrappy;
    function wrappy(fn, cb) {
      if (fn && cb) return wrappy(fn)(cb);
      if (typeof fn !== "function")
        throw new TypeError("need wrapper function");
      Object.keys(fn).forEach(function(k) {
        wrapper[k] = fn[k];
      });
      return wrapper;
      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret = fn.apply(this, args);
        var cb2 = args[args.length - 1];
        if (typeof ret === "function" && ret !== cb2) {
          Object.keys(cb2).forEach(function(k) {
            ret[k] = cb2[k];
          });
        }
        return ret;
      }
    }
  }
});

// node_modules/once/once.js
var require_once = __commonJS({
  "node_modules/once/once.js"(exports2, module2) {
    var wrappy = require_wrappy();
    module2.exports = wrappy(once);
    module2.exports.strict = wrappy(onceStrict);
    once.proto = once(function() {
      Object.defineProperty(Function.prototype, "once", {
        value: function() {
          return once(this);
        },
        configurable: true
      });
      Object.defineProperty(Function.prototype, "onceStrict", {
        value: function() {
          return onceStrict(this);
        },
        configurable: true
      });
    });
    function once(fn) {
      var f = function() {
        if (f.called) return f.value;
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      f.called = false;
      return f;
    }
    function onceStrict(fn) {
      var f = function() {
        if (f.called)
          throw new Error(f.onceError);
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      var name = fn.name || "Function wrapped with `once`";
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f;
    }
  }
});

// node_modules/end-of-stream/index.js
var require_end_of_stream = __commonJS({
  "node_modules/end-of-stream/index.js"(exports2, module2) {
    var once = require_once();
    var noop = function() {
    };
    var qnt = global.Bare ? queueMicrotask : process.nextTick.bind(process);
    var isRequest = function(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    };
    var isChildProcess = function(stream) {
      return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3;
    };
    var eos = function(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once(callback || noop);
      var ws = stream._writableState;
      var rs = stream._readableState;
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var cancelled = false;
      var onlegacyfinish = function() {
        if (!stream.writable) onfinish();
      };
      var onfinish = function() {
        writable = false;
        if (!readable) callback.call(stream);
      };
      var onend = function() {
        readable = false;
        if (!writable) callback.call(stream);
      };
      var onexit = function(exitCode) {
        callback.call(stream, exitCode ? new Error("exited with error code: " + exitCode) : null);
      };
      var onerror = function(err) {
        callback.call(stream, err);
      };
      var onclose = function() {
        qnt(onclosenexttick);
      };
      var onclosenexttick = function() {
        if (cancelled) return;
        if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream, new Error("premature close"));
        if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream, new Error("premature close"));
      };
      var onrequest = function() {
        stream.req.on("finish", onfinish);
      };
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !ws) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      if (isChildProcess(stream)) stream.on("exit", onexit);
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        cancelled = true;
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("exit", onexit);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    };
    module2.exports = eos;
  }
});

// node_modules/pump/index.js
var require_pump = __commonJS({
  "node_modules/pump/index.js"(exports2, module2) {
    var once = require_once();
    var eos = require_end_of_stream();
    var fs;
    try {
      fs = require("fs");
    } catch (e) {
    }
    var noop = function() {
    };
    var ancient = typeof process === "undefined" ? false : /^v?\.0/.test(process.version);
    var isFn = function(fn) {
      return typeof fn === "function";
    };
    var isFS = function(stream) {
      if (!ancient) return false;
      if (!fs) return false;
      return (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) && isFn(stream.close);
    };
    var isRequest = function(stream) {
      return stream.setHeader && isFn(stream.abort);
    };
    var destroyer = function(stream, reading, writing, callback) {
      callback = once(callback);
      var closed = false;
      stream.on("close", function() {
        closed = true;
      });
      eos(stream, { readable: reading, writable: writing }, function(err) {
        if (err) return callback(err);
        closed = true;
        callback();
      });
      var destroyed = false;
      return function(err) {
        if (closed) return;
        if (destroyed) return;
        destroyed = true;
        if (isFS(stream)) return stream.close(noop);
        if (isRequest(stream)) return stream.abort();
        if (isFn(stream.destroy)) return stream.destroy();
        callback(err || new Error("stream was destroyed"));
      };
    };
    var call = function(fn) {
      fn();
    };
    var pipe = function(from, to) {
      return from.pipe(to);
    };
    var pump = function() {
      var streams = Array.prototype.slice.call(arguments);
      var callback = isFn(streams[streams.length - 1] || noop) && streams.pop() || noop;
      if (Array.isArray(streams[0])) streams = streams[0];
      if (streams.length < 2) throw new Error("pump requires two streams per minimum");
      var error;
      var destroys = streams.map(function(stream, i) {
        var reading = i < streams.length - 1;
        var writing = i > 0;
        return destroyer(stream, reading, writing, function(err) {
          if (!error) error = err;
          if (err) destroys.forEach(call);
          if (reading) return;
          destroys.forEach(call);
          callback(error);
        });
      });
      return streams.reduce(pipe);
    };
    module2.exports = pump;
  }
});

// node_modules/byline/lib/byline.js
var require_byline = __commonJS({
  "node_modules/byline/lib/byline.js"(exports2, module2) {
    var stream = require("stream");
    var util = require("util");
    var timers = require("timers");
    module2.exports = function(readStream, options) {
      return module2.exports.createStream(readStream, options);
    };
    module2.exports.createStream = function(readStream, options) {
      if (readStream) {
        return createLineStream(readStream, options);
      } else {
        return new LineStream(options);
      }
    };
    module2.exports.createLineStream = function(readStream) {
      console.log("WARNING: byline#createLineStream is deprecated and will be removed soon");
      return createLineStream(readStream);
    };
    function createLineStream(readStream, options) {
      if (!readStream) {
        throw new Error("expected readStream");
      }
      if (!readStream.readable) {
        throw new Error("readStream must be readable");
      }
      var ls = new LineStream(options);
      readStream.pipe(ls);
      return ls;
    }
    module2.exports.LineStream = LineStream;
    function LineStream(options) {
      stream.Transform.call(this, options);
      options = options || {};
      this._readableState.objectMode = true;
      this._lineBuffer = [];
      this._keepEmptyLines = options.keepEmptyLines || false;
      this._lastChunkEndedWithCR = false;
      var self2 = this;
      this.on("pipe", function(src) {
        if (!self2.encoding) {
          if (src instanceof stream.Readable) {
            self2.encoding = src._readableState.encoding;
          }
        }
      });
    }
    util.inherits(LineStream, stream.Transform);
    LineStream.prototype._transform = function(chunk, encoding, done) {
      encoding = encoding || "utf8";
      if (Buffer.isBuffer(chunk)) {
        if (encoding == "buffer") {
          chunk = chunk.toString();
          encoding = "utf8";
        } else {
          chunk = chunk.toString(encoding);
        }
      }
      this._chunkEncoding = encoding;
      var lines = chunk.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g);
      if (this._lastChunkEndedWithCR && chunk[0] == "\n") {
        lines.shift();
      }
      if (this._lineBuffer.length > 0) {
        this._lineBuffer[this._lineBuffer.length - 1] += lines[0];
        lines.shift();
      }
      this._lastChunkEndedWithCR = chunk[chunk.length - 1] == "\r";
      this._lineBuffer = this._lineBuffer.concat(lines);
      this._pushBuffer(encoding, 1, done);
    };
    LineStream.prototype._pushBuffer = function(encoding, keep, done) {
      while (this._lineBuffer.length > keep) {
        var line = this._lineBuffer.shift();
        if (this._keepEmptyLines || line.length > 0) {
          if (!this.push(this._reencode(line, encoding))) {
            var self2 = this;
            timers.setImmediate(function() {
              self2._pushBuffer(encoding, keep, done);
            });
            return;
          }
        }
      }
      done();
    };
    LineStream.prototype._flush = function(done) {
      this._pushBuffer(this._chunkEncoding, 0, done);
    };
    LineStream.prototype._reencode = function(line, chunkEncoding) {
      if (this.encoding && this.encoding != chunkEncoding) {
        return new Buffer(line, chunkEncoding).toString(this.encoding);
      } else if (this.encoding) {
        return line;
      } else {
        return new Buffer(line, chunkEncoding);
      }
    };
  }
});

// node_modules/@bugsnag/node/dist/bugsnag.js
var require_bugsnag = __commonJS({
  "node_modules/@bugsnag/node/dist/bugsnag.js"(exports2, module2) {
    (function(f) {
      if (typeof exports2 === "object" && typeof module2 !== "undefined") {
        module2.exports = f();
      } else if (typeof define === "function" && define.amd) {
        define([], f);
      } else {
        var g;
        if (typeof window !== "undefined") {
          g = window;
        } else if (typeof global !== "undefined") {
          g = global;
        } else if (typeof self !== "undefined") {
          g = self;
        } else {
          g = this;
        }
        g.bugsnag = f();
      }
    })(function() {
      var define2, module3, exports3;
      var reduce = function(arr, fn, accum) {
        var val = accum;
        for (var i = 0, len = arr.length; i < len; i++) {
          val = fn(val, arr[i], i, arr);
        }
        return val;
      };
      var filter = function(arr, fn) {
        return reduce(arr, function(accum, item, i, arr2) {
          return !fn(item, i, arr2) ? accum : accum.concat(item);
        }, []);
      };
      var map = function(arr, fn) {
        return reduce(arr, function(accum, item, i, arr2) {
          return accum.concat(fn(item, i, arr2));
        }, []);
      };
      var includes = function(arr, x) {
        return reduce(arr, function(accum, item, i, arr2) {
          return accum === true || item === x;
        }, false);
      };
      var _hasDontEnumBug = !{
        toString: null
      }.propertyIsEnumerable("toString");
      var _dontEnums = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"];
      var keys = function(obj) {
        var result = [];
        var prop;
        for (prop in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, prop)) result.push(prop);
        }
        if (!_hasDontEnumBug) return result;
        for (var i = 0, len = _dontEnums.length; i < len; i++) {
          if (Object.prototype.hasOwnProperty.call(obj, _dontEnums[i])) result.push(_dontEnums[i]);
        }
        return result;
      };
      var isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
      };
      var _pad = function(n) {
        return n < 10 ? "0" + n : n;
      };
      var isoDate = function() {
        var d = /* @__PURE__ */ new Date();
        return d.getUTCFullYear() + "-" + _pad(d.getUTCMonth() + 1) + "-" + _pad(d.getUTCDate()) + "T" + _pad(d.getUTCHours()) + ":" + _pad(d.getUTCMinutes()) + ":" + _pad(d.getUTCSeconds()) + "." + (d.getUTCMilliseconds() / 1e3).toFixed(3).slice(2, 5) + "Z";
      };
      var _$esUtils_8 = {
        map,
        reduce,
        filter,
        includes,
        keys,
        isArray,
        isoDate
      };
      var __isoDate_2 = _$esUtils_8.isoDate;
      var BugsnagBreadcrumb = /* @__PURE__ */ (function() {
        function BugsnagBreadcrumb2(name2, metaData, type, timestamp) {
          if (name2 === void 0) {
            name2 = "[anonymous]";
          }
          if (metaData === void 0) {
            metaData = {};
          }
          if (type === void 0) {
            type = "manual";
          }
          if (timestamp === void 0) {
            timestamp = __isoDate_2();
          }
          this.type = type;
          this.name = name2;
          this.metaData = metaData;
          this.timestamp = timestamp;
        }
        var _proto = BugsnagBreadcrumb2.prototype;
        _proto.toJSON = function toJSON() {
          return {
            type: this.type,
            name: this.name,
            timestamp: this.timestamp,
            metaData: this.metaData
          };
        };
        return BugsnagBreadcrumb2;
      })();
      var _$BugsnagBreadcrumb_2 = BugsnagBreadcrumb;
      var _$validators_18 = {};
      _$validators_18.intRange = function(min, max) {
        if (min === void 0) {
          min = 1;
        }
        if (max === void 0) {
          max = Infinity;
        }
        return function(value) {
          return typeof value === "number" && parseInt("" + value, 10) === value && value >= min && value <= max;
        };
      };
      _$validators_18.stringWithLength = function(value) {
        return typeof value === "string" && !!value.length;
      };
      var _$config_4 = {};
      var __filter_4 = _$esUtils_8.filter, __reduce_4 = _$esUtils_8.reduce, __keys_4 = _$esUtils_8.keys, __isArray_4 = _$esUtils_8.isArray, __includes_4 = _$esUtils_8.includes;
      var intRange = _$validators_18.intRange, stringWithLength = _$validators_18.stringWithLength;
      _$config_4.schema = {
        apiKey: {
          defaultValue: function() {
            return null;
          },
          message: "is required",
          validate: stringWithLength
        },
        appVersion: {
          defaultValue: function() {
            return null;
          },
          message: "should be a string",
          validate: function(value) {
            return value === null || stringWithLength(value);
          }
        },
        appType: {
          defaultValue: function() {
            return null;
          },
          message: "should be a string",
          validate: function(value) {
            return value === null || stringWithLength(value);
          }
        },
        autoNotify: {
          defaultValue: function() {
            return true;
          },
          message: "should be true|false",
          validate: function(value) {
            return value === true || value === false;
          }
        },
        beforeSend: {
          defaultValue: function() {
            return [];
          },
          message: "should be a function or array of functions",
          validate: function(value) {
            return typeof value === "function" || __isArray_4(value) && __filter_4(value, function(f) {
              return typeof f === "function";
            }).length === value.length;
          }
        },
        endpoints: {
          defaultValue: function() {
            return {
              notify: "https://notify.bugsnag.com",
              sessions: "https://sessions.bugsnag.com"
            };
          },
          message: "should be an object containing endpoint URLs { notify, sessions }. sessions is optional if autoCaptureSessions=false",
          validate: function(val, obj) {
            return (
              // first, ensure it's an object
              val && typeof val === "object" && // endpoints.notify must always be set
              stringWithLength(val.notify) && // endpoints.sessions must be set unless session tracking is explicitly off
              (obj.autoCaptureSessions === false || stringWithLength(val.sessions)) && // ensure no keys other than notify/session are set on endpoints object
              __filter_4(__keys_4(val), function(k) {
                return !__includes_4(["notify", "sessions"], k);
              }).length === 0
            );
          }
        },
        autoCaptureSessions: {
          defaultValue: function(val, opts) {
            return opts.endpoints === void 0 || !!opts.endpoints && !!opts.endpoints.sessions;
          },
          message: "should be true|false",
          validate: function(val) {
            return val === true || val === false;
          }
        },
        notifyReleaseStages: {
          defaultValue: function() {
            return null;
          },
          message: "should be an array of strings",
          validate: function(value) {
            return value === null || __isArray_4(value) && __filter_4(value, function(f) {
              return typeof f === "string";
            }).length === value.length;
          }
        },
        releaseStage: {
          defaultValue: function() {
            return "production";
          },
          message: "should be a string",
          validate: function(value) {
            return typeof value === "string" && value.length;
          }
        },
        maxBreadcrumbs: {
          defaultValue: function() {
            return 20;
          },
          message: "should be a number \u226440",
          validate: function(value) {
            return intRange(0, 40)(value);
          }
        },
        autoBreadcrumbs: {
          defaultValue: function() {
            return true;
          },
          message: "should be true|false",
          validate: function(value) {
            return typeof value === "boolean";
          }
        },
        user: {
          defaultValue: function() {
            return null;
          },
          message: "(object) user should be an object",
          validate: function(value) {
            return typeof value === "object";
          }
        },
        metaData: {
          defaultValue: function() {
            return null;
          },
          message: "should be an object",
          validate: function(value) {
            return typeof value === "object";
          }
        },
        logger: {
          defaultValue: function() {
            return void 0;
          },
          message: "should be null or an object with methods { debug, info, warn, error }",
          validate: function(value) {
            return !value || value && __reduce_4(["debug", "info", "warn", "error"], function(accum, method) {
              return accum && typeof value[method] === "function";
            }, true);
          }
        },
        filters: {
          defaultValue: function() {
            return ["password"];
          },
          message: "should be an array of strings|regexes",
          validate: function(value) {
            return __isArray_4(value) && value.length === __filter_4(value, function(s) {
              return typeof s === "string" || s && typeof s.test === "function";
            }).length;
          }
        }
      };
      _$config_4.mergeDefaults = function(opts, schema2) {
        if (!opts || !schema2) throw new Error("opts and schema objects are required");
        return __reduce_4(__keys_4(schema2), function(accum, key) {
          accum[key] = opts[key] !== void 0 ? opts[key] : schema2[key].defaultValue(opts[key], opts);
          return accum;
        }, {});
      };
      _$config_4.validate = function(opts, schema2) {
        if (!opts || !schema2) throw new Error("opts and schema objects are required");
        var errors = __reduce_4(__keys_4(schema2), function(accum, key) {
          if (schema2[key].validate(opts[key], opts)) return accum;
          return accum.concat({
            key,
            message: schema2[key].message,
            value: opts[key]
          });
        }, []);
        return {
          valid: !errors.length,
          errors
        };
      };
      var _$asyncSome_5 = function(arr, fn, cb) {
        var length2 = arr.length;
        var index = 0;
        var next = function() {
          if (index >= length2) return cb(null, false);
          fn(arr[index], function(err, result) {
            if (err) return cb(err, false);
            if (result === true) return cb(null, true);
            index++;
            next();
          });
        };
        next();
      };
      var _$inferReleaseStage_10 = function(client) {
        return client.app && typeof client.app.releaseStage === "string" ? client.app.releaseStage : client.config.releaseStage;
      };
      var _$iserror_11 = require_iserror();
      var _$runBeforeSend_17 = function(report, onError) {
        return function(fn, cb) {
          if (typeof fn !== "function") return cb(null, false);
          try {
            if (fn.length !== 2) {
              var ret = fn(report);
              if (ret && typeof ret.then === "function") {
                return ret.then(
                  // resolve
                  function(val) {
                    return setTimeout(function() {
                      return cb(null, shouldPreventSend(report, val));
                    }, 0);
                  },
                  // reject
                  function(err) {
                    setTimeout(function() {
                      onError(err);
                      return cb(null, false);
                    });
                  }
                );
              }
              return cb(null, shouldPreventSend(report, ret));
            }
            fn(report, function(err, result) {
              if (err) {
                onError(err);
                return cb(null, false);
              }
              cb(null, shouldPreventSend(report, result));
            });
          } catch (e) {
            onError(e);
            cb(null, false);
          }
        };
      };
      var shouldPreventSend = function(report, value) {
        return report.isIgnored() || value === false;
      };
      var _$errorStackParser_7 = require_error_stack_parser();
      var _$hasStack_9 = function(err) {
        return !!err && (!!err.stack || !!err.stacktrace || !!err["opera#sourceloc"]) && typeof (err.stack || err.stacktrace || err["opera#sourceloc"]) === "string" && err.stack !== err.name + ": " + err.message;
      };
      var _$jsRuntime_12 = process.env.IS_BROWSER ? "browserjs" : typeof navigator !== "undefined" && navigator.product === "ReactNative" ? typeof Expo !== "undefined" ? "expojs" : "reactnativejs" : "nodejs";
      function _extends() {
        _extends = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return _extends.apply(this, arguments);
      }
      ;
      var StackGenerator = require_stack_generator();
      ;
      var __reduce_23 = _$esUtils_8.reduce, __filter_23 = _$esUtils_8.filter;
      ;
      var BugsnagReport = /* @__PURE__ */ (function() {
        function BugsnagReport2(errorClass, errorMessage, stacktrace, handledState, originalError) {
          if (stacktrace === void 0) {
            stacktrace = [];
          }
          if (handledState === void 0) {
            handledState = defaultHandledState();
          }
          this.__isBugsnagReport = true;
          this._ignored = false;
          this._handledState = handledState;
          this.app = void 0;
          this.apiKey = void 0;
          this.breadcrumbs = [];
          this.context = void 0;
          this.device = void 0;
          this.errorClass = stringOrFallback(errorClass, "[no error class]");
          this.errorMessage = stringOrFallback(errorMessage, "[no error message]");
          this.groupingHash = void 0;
          this.metaData = {};
          this.request = void 0;
          this.severity = this._handledState.severity;
          this.stacktrace = __reduce_23(stacktrace, function(accum, frame) {
            var f = formatStackframe(frame);
            try {
              if (JSON.stringify(f) === "{}") return accum;
              return accum.concat(f);
            } catch (e) {
              return accum;
            }
          }, []);
          this.user = void 0;
          this.session = void 0;
          this.originalError = originalError;
        }
        var _proto = BugsnagReport2.prototype;
        _proto.ignore = function ignore() {
          this._ignored = true;
        };
        _proto.isIgnored = function isIgnored() {
          return this._ignored;
        };
        _proto.updateMetaData = function updateMetaData(section) {
          var _updates;
          if (!section) return this;
          var updates;
          if ((arguments.length <= 1 ? void 0 : arguments[1]) === null) return this.removeMetaData(section);
          if ((arguments.length <= 2 ? void 0 : arguments[2]) === null) return this.removeMetaData(section, arguments.length <= 1 ? void 0 : arguments[1], arguments.length <= 2 ? void 0 : arguments[2]);
          if (typeof (arguments.length <= 1 ? void 0 : arguments[1]) === "object") updates = arguments.length <= 1 ? void 0 : arguments[1];
          if (typeof (arguments.length <= 1 ? void 0 : arguments[1]) === "string") updates = (_updates = {}, _updates[arguments.length <= 1 ? void 0 : arguments[1]] = arguments.length <= 2 ? void 0 : arguments[2], _updates);
          if (!updates) return this;
          if (!this.metaData[section]) this.metaData[section] = {};
          this.metaData[section] = _extends({}, this.metaData[section], updates);
          return this;
        };
        _proto.removeMetaData = function removeMetaData(section, property) {
          if (typeof section !== "string") return this;
          if (!property) {
            delete this.metaData[section];
            return this;
          }
          if (this.metaData[section]) {
            delete this.metaData[section][property];
            return this;
          }
          return this;
        };
        _proto.toJSON = function toJSON() {
          return {
            payloadVersion: "4",
            exceptions: [{
              errorClass: this.errorClass,
              message: this.errorMessage,
              stacktrace: this.stacktrace,
              type: _$jsRuntime_12
            }],
            severity: this.severity,
            unhandled: this._handledState.unhandled,
            severityReason: this._handledState.severityReason,
            app: this.app,
            device: this.device,
            breadcrumbs: this.breadcrumbs,
            context: this.context,
            user: this.user,
            metaData: this.metaData,
            groupingHash: this.groupingHash,
            request: this.request,
            session: this.session
          };
        };
        return BugsnagReport2;
      })();
      var formatStackframe = function(frame) {
        var f = {
          file: frame.fileName,
          method: normaliseFunctionName(frame.functionName),
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
          code: void 0,
          inProject: void 0
          // Some instances result in no file:
          // - calling notify() from chrome's terminal results in no file/method.
          // - non-error exception thrown from global code in FF
          // This adds one.
        };
        if (f.lineNumber > -1 && !f.file && !f.method) {
          f.file = "global code";
        }
        return f;
      };
      var normaliseFunctionName = function(name2) {
        return /^global code$/i.test(name2) ? "global code" : name2;
      };
      var defaultHandledState = function() {
        return {
          unhandled: false,
          severity: "warning",
          severityReason: {
            type: "handledException"
          }
        };
      };
      var stringOrFallback = function(str, fallback) {
        return typeof str === "string" && str ? str : fallback;
      };
      BugsnagReport.getStacktrace = function(error, errorFramesToSkip, generatedFramesToSkip) {
        if (errorFramesToSkip === void 0) {
          errorFramesToSkip = 0;
        }
        if (generatedFramesToSkip === void 0) {
          generatedFramesToSkip = 0;
        }
        if (_$hasStack_9(error)) return _$errorStackParser_7.parse(error).slice(errorFramesToSkip);
        try {
          throw error;
        } catch (e) {
          if (_$hasStack_9(e)) return _$errorStackParser_7.parse(error).slice(1 + generatedFramesToSkip);
          try {
            return __filter_23(StackGenerator.backtrace(), function(frame) {
              return (frame.functionName || "").indexOf("StackGenerator$$") === -1;
            }).slice(1 + generatedFramesToSkip);
          } catch (e2) {
            return [];
          }
        }
      };
      BugsnagReport.ensureReport = function(reportOrError, errorFramesToSkip, generatedFramesToSkip) {
        if (errorFramesToSkip === void 0) {
          errorFramesToSkip = 0;
        }
        if (generatedFramesToSkip === void 0) {
          generatedFramesToSkip = 0;
        }
        if (reportOrError.__isBugsnagReport) return reportOrError;
        try {
          var stacktrace = BugsnagReport.getStacktrace(reportOrError, errorFramesToSkip, 1 + generatedFramesToSkip);
          return new BugsnagReport(reportOrError.name, reportOrError.message, stacktrace, void 0, reportOrError);
        } catch (e) {
          return new BugsnagReport(reportOrError.name, reportOrError.message, [], void 0, reportOrError);
        }
      };
      var _$BugsnagReport_23 = BugsnagReport;
      var _$pad_21 = function pad(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length - size);
      };
      ;
      var os = require("os"), padding = 2, pid = _$pad_21(process.pid.toString(36), padding), hostname = os.hostname(), length = hostname.length, hostId = _$pad_21(hostname.split("").reduce(function(prev, char) {
        return +prev + char.charCodeAt(0);
      }, +length + 36).toString(36), padding);
      var _$fingerprint_20 = function fingerprint() {
        return pid + hostId;
      };
      ;
      ;
      var c = 0, blockSize = 4, base = 36, discreteValues = Math.pow(base, blockSize);
      function randomBlock() {
        return _$pad_21((Math.random() * discreteValues << 0).toString(base), blockSize);
      }
      function safeCounter() {
        c = c < discreteValues ? c : 0;
        c++;
        return c - 1;
      }
      function cuid() {
        var letter = "c", timestamp = (/* @__PURE__ */ new Date()).getTime().toString(base), counter = _$pad_21(safeCounter().toString(base), blockSize), print = _$fingerprint_20(), random = randomBlock() + randomBlock();
        return letter + timestamp + counter + print + random;
      }
      cuid.fingerprint = _$fingerprint_20;
      var _$cuid_19 = cuid;
      var __isoDate_24 = _$esUtils_8.isoDate;
      ;
      var Session = /* @__PURE__ */ (function() {
        function Session2() {
          this.id = _$cuid_19();
          this.startedAt = __isoDate_24();
          this._handled = 0;
          this._unhandled = 0;
        }
        var _proto = Session2.prototype;
        _proto.toJSON = function toJSON() {
          return {
            id: this.id,
            startedAt: this.startedAt,
            events: {
              handled: this._handled,
              unhandled: this._unhandled
            }
          };
        };
        _proto.trackError = function trackError(report) {
          this[report._handledState.unhandled ? "_unhandled" : "_handled"] += 1;
        };
        return Session2;
      })();
      var _$Session_24 = Session;
      function ___extends_3() {
        ___extends_3 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_3.apply(this, arguments);
      }
      ;
      ;
      ;
      ;
      var __map_3 = _$esUtils_8.map, __includes_3 = _$esUtils_8.includes, __isArray_3 = _$esUtils_8.isArray;
      ;
      ;
      ;
      ;
      var LOG_USAGE_ERR_PREFIX = "Usage error.";
      var REPORT_USAGE_ERR_PREFIX = "Bugsnag usage error.";
      var BugsnagClient = /* @__PURE__ */ (function() {
        function BugsnagClient2(notifier) {
          if (!notifier || !notifier.name || !notifier.version || !notifier.url) {
            throw new Error("`notifier` argument is required");
          }
          this.notifier = notifier;
          this._configured = false;
          this._opts = {};
          this.config = {};
          this._delivery = {
            sendSession: function() {
            },
            sendReport: function() {
            }
          };
          this._logger = {
            debug: function() {
            },
            info: function() {
            },
            warn: function() {
            },
            error: function() {
            }
            // plugins
          };
          this._plugins = {};
          this._session = null;
          this.breadcrumbs = [];
          this.app = {};
          this.context = void 0;
          this.device = void 0;
          this.metaData = void 0;
          this.request = void 0;
          this.user = {};
          this.BugsnagClient = BugsnagClient2;
          this.BugsnagReport = _$BugsnagReport_23;
          this.BugsnagBreadcrumb = _$BugsnagBreadcrumb_2;
          this.BugsnagSession = _$Session_24;
          var self2 = this;
          var notify = this.notify;
          this.notify = function() {
            return notify.apply(self2, arguments);
          };
        }
        var _proto = BugsnagClient2.prototype;
        _proto.setOptions = function setOptions(opts) {
          this._opts = ___extends_3({}, this._opts, opts);
        };
        _proto.configure = function configure(partialSchema) {
          if (partialSchema === void 0) {
            partialSchema = _$config_4.schema;
          }
          var conf = _$config_4.mergeDefaults(this._opts, partialSchema);
          var validity = _$config_4.validate(conf, partialSchema);
          if (!validity.valid === true) throw new Error(generateConfigErrorMessage(validity.errors));
          if (typeof conf.beforeSend === "function") conf.beforeSend = [conf.beforeSend];
          if (conf.appVersion) this.app.version = conf.appVersion;
          if (conf.appType) this.app.type = conf.appType;
          if (conf.metaData) this.metaData = conf.metaData;
          if (conf.user) this.user = conf.user;
          if (conf.logger) this.logger(conf.logger);
          this.config = ___extends_3({}, this.config, conf);
          this._configured = true;
          return this;
        };
        _proto.use = function use(plugin) {
          if (!this._configured) throw new Error("client not configured");
          if (plugin.configSchema) this.configure(plugin.configSchema);
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          var result = plugin.init.apply(plugin, [this].concat(args));
          if (plugin.name) this._plugins["~" + plugin.name + "~"] = result;
          return this;
        };
        _proto.getPlugin = function getPlugin(name2) {
          return this._plugins["~" + name2 + "~"];
        };
        _proto.delivery = function delivery(d) {
          this._delivery = d(this);
          return this;
        };
        _proto.logger = function logger(l, sid) {
          this._logger = l;
          return this;
        };
        _proto.sessionDelegate = function sessionDelegate(s) {
          this._sessionDelegate = s;
          return this;
        };
        _proto.startSession = function startSession() {
          if (!this._sessionDelegate) {
            this._logger.warn("No session implementation is installed");
            return this;
          }
          return this._sessionDelegate.startSession(this);
        };
        _proto.leaveBreadcrumb = function leaveBreadcrumb(name2, metaData, type, timestamp) {
          if (!this._configured) throw new Error("client not configured");
          name2 = name2 || void 0;
          type = typeof type === "string" ? type : void 0;
          timestamp = typeof timestamp === "string" ? timestamp : void 0;
          metaData = typeof metaData === "object" && metaData !== null ? metaData : void 0;
          if (typeof name2 !== "string" && !metaData) return;
          var crumb = new _$BugsnagBreadcrumb_2(name2, metaData, type, timestamp);
          this.breadcrumbs.push(crumb);
          if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(this.breadcrumbs.length - this.config.maxBreadcrumbs);
          }
          return this;
        };
        _proto.notify = function notify(error, opts, cb) {
          var _this = this;
          if (opts === void 0) {
            opts = {};
          }
          if (cb === void 0) {
            cb = function() {
            };
          }
          if (!this._configured) throw new Error("client not configured");
          var releaseStage = _$inferReleaseStage_10(this);
          var _normaliseError = normaliseError(error, opts, this._logger), err = _normaliseError.err, errorFramesToSkip = _normaliseError.errorFramesToSkip, _opts = _normaliseError._opts;
          if (_opts) opts = _opts;
          if (typeof opts !== "object" || opts === null) opts = {};
          var report = _$BugsnagReport_23.ensureReport(err, errorFramesToSkip, 2);
          report.app = ___extends_3({}, {
            releaseStage
          }, report.app, this.app);
          report.context = report.context || opts.context || this.context || void 0;
          report.device = ___extends_3({}, report.device, this.device, opts.device);
          report.request = ___extends_3({}, report.request, this.request, opts.request);
          report.user = ___extends_3({}, report.user, this.user, opts.user);
          report.metaData = ___extends_3({}, report.metaData, this.metaData, opts.metaData);
          report.breadcrumbs = this.breadcrumbs.slice(0);
          if (this._session) {
            this._session.trackError(report);
            report.session = this._session;
          }
          if (opts.severity !== void 0) {
            report.severity = opts.severity;
            report._handledState.severityReason = {
              type: "userSpecifiedSeverity"
            };
          }
          if (__isArray_3(this.config.notifyReleaseStages) && !__includes_3(this.config.notifyReleaseStages, releaseStage)) {
            this._logger.warn("Report not sent due to releaseStage/notifyReleaseStages configuration");
            return cb(null, report);
          }
          var originalSeverity = report.severity;
          var beforeSend = [].concat(opts.beforeSend).concat(this.config.beforeSend);
          var onBeforeSendErr = function(err2) {
            _this._logger.error("Error occurred in beforeSend callback, continuing anyway\u2026");
            _this._logger.error(err2);
          };
          _$asyncSome_5(beforeSend, _$runBeforeSend_17(report, onBeforeSendErr), function(err2, preventSend) {
            if (err2) onBeforeSendErr(err2);
            if (preventSend) {
              _this._logger.debug("Report not sent due to beforeSend callback");
              return cb(null, report);
            }
            if (_this.config.autoBreadcrumbs) {
              _this.leaveBreadcrumb(report.errorClass, {
                errorClass: report.errorClass,
                errorMessage: report.errorMessage,
                severity: report.severity
              }, "error");
            }
            if (originalSeverity !== report.severity) {
              report._handledState.severityReason = {
                type: "userCallbackSetSeverity"
              };
            }
            _this._delivery.sendReport({
              apiKey: report.apiKey || _this.config.apiKey,
              notifier: _this.notifier,
              events: [report]
            }, function(err3) {
              return cb(err3, report);
            });
          });
        };
        return BugsnagClient2;
      })();
      var normaliseError = function(error, opts, logger) {
        var synthesizedErrorFramesToSkip = 3;
        var createAndLogUsageError = function(reason) {
          var msg = generateNotifyUsageMessage(reason);
          logger.warn(LOG_USAGE_ERR_PREFIX + " " + msg);
          return new Error(REPORT_USAGE_ERR_PREFIX + " " + msg);
        };
        var err;
        var errorFramesToSkip = 0;
        var _opts;
        switch (typeof error) {
          case "string":
            if (typeof opts === "string") {
              err = createAndLogUsageError("string/string");
              _opts = {
                metaData: {
                  notifier: {
                    notifyArgs: [error, opts]
                  }
                }
              };
            } else {
              err = new Error(String(error));
              errorFramesToSkip = synthesizedErrorFramesToSkip;
            }
            break;
          case "number":
          case "boolean":
            err = new Error(String(error));
            break;
          case "function":
            err = createAndLogUsageError("function");
            break;
          case "object":
            if (error !== null && (_$iserror_11(error) || error.__isBugsnagReport)) {
              err = error;
            } else if (error !== null && hasNecessaryFields(error)) {
              err = new Error(error.message || error.errorMessage);
              err.name = error.name || error.errorClass;
              errorFramesToSkip = synthesizedErrorFramesToSkip;
            } else {
              err = createAndLogUsageError(error === null ? "null" : "unsupported object");
            }
            break;
          default:
            err = createAndLogUsageError("nothing");
        }
        return {
          err,
          errorFramesToSkip,
          _opts
        };
      };
      var hasNecessaryFields = function(error) {
        return (typeof error.name === "string" || typeof error.errorClass === "string") && (typeof error.message === "string" || typeof error.errorMessage === "string");
      };
      var generateConfigErrorMessage = function(errors) {
        return "Bugsnag configuration error\n" + __map_3(errors, function(err) {
          return '"' + err.key + '" ' + err.message + " \n    got " + stringify(err.value);
        }).join("\n\n");
      };
      var generateNotifyUsageMessage = function(actual) {
        return "notify() expected error/opts parameters, got " + actual;
      };
      var stringify = function(val) {
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      };
      var _$BugsnagClient_3 = BugsnagClient;
      var _$safeJsonStringify_22 = function(data, replacer, space, opts) {
        var filterKeys = opts && opts.filterKeys ? opts.filterKeys : [];
        var filterPaths = opts && opts.filterPaths ? opts.filterPaths : [];
        return JSON.stringify(prepareObjForSerialization(data, filterKeys, filterPaths), replacer, space);
      };
      var MAX_DEPTH = 20;
      var MAX_EDGES = 25e3;
      var MIN_PRESERVED_DEPTH = 8;
      var REPLACEMENT_NODE = "...";
      function __isError_22(o) {
        return o instanceof Error || /^\[object (Error|(Dom)?Exception)\]$/.test(Object.prototype.toString.call(o));
      }
      function throwsMessage(err) {
        return "[Throws: " + (err ? err.message : "?") + "]";
      }
      function find(haystack, needle) {
        for (var i = 0, len = haystack.length; i < len; i++) {
          if (haystack[i] === needle) return true;
        }
        return false;
      }
      function isDescendent(paths, path) {
        for (var i = 0, len = paths.length; i < len; i++) {
          if (path.indexOf(paths[i]) === 0) return true;
        }
        return false;
      }
      function shouldFilter(patterns, key) {
        for (var i = 0, len = patterns.length; i < len; i++) {
          if (typeof patterns[i] === "string" && patterns[i] === key) return true;
          if (patterns[i] && typeof patterns[i].test === "function" && patterns[i].test(key)) return true;
        }
        return false;
      }
      function __isArray_22(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
      }
      function safelyGetProp(obj, prop) {
        try {
          return obj[prop];
        } catch (err) {
          return throwsMessage(err);
        }
      }
      function prepareObjForSerialization(obj, filterKeys, filterPaths) {
        var seen = [];
        var edges = 0;
        function visit(obj2, path) {
          function edgesExceeded() {
            return path.length > MIN_PRESERVED_DEPTH && edges > MAX_EDGES;
          }
          edges++;
          if (path.length > MAX_DEPTH) return REPLACEMENT_NODE;
          if (edgesExceeded()) return REPLACEMENT_NODE;
          if (obj2 === null || typeof obj2 !== "object") return obj2;
          if (find(seen, obj2)) return "[Circular]";
          seen.push(obj2);
          if (typeof obj2.toJSON === "function") {
            try {
              edges--;
              var fResult = visit(obj2.toJSON(), path);
              seen.pop();
              return fResult;
            } catch (err) {
              return throwsMessage(err);
            }
          }
          var er = __isError_22(obj2);
          if (er) {
            edges--;
            var eResult = visit({
              name: obj2.name,
              message: obj2.message
            }, path);
            seen.pop();
            return eResult;
          }
          if (__isArray_22(obj2)) {
            var aResult = [];
            for (var i = 0, len = obj2.length; i < len; i++) {
              if (edgesExceeded()) {
                aResult.push(REPLACEMENT_NODE);
                break;
              }
              aResult.push(visit(obj2[i], path.concat("[]")));
            }
            seen.pop();
            return aResult;
          }
          var result = {};
          try {
            for (var prop in obj2) {
              if (!Object.prototype.hasOwnProperty.call(obj2, prop)) continue;
              if (isDescendent(filterPaths, path.join(".")) && shouldFilter(filterKeys, prop)) {
                result[prop] = "[Filtered]";
                continue;
              }
              if (edgesExceeded()) {
                result[prop] = REPLACEMENT_NODE;
                break;
              }
              result[prop] = visit(safelyGetProp(obj2, prop), path.concat(prop));
            }
          } catch (e) {
          }
          seen.pop();
          return result;
        }
        return visit(obj, []);
      }
      var _$jsonPayload_13 = {};
      ;
      var REPORT_FILTER_PATHS = ["events.[].app", "events.[].metaData", "events.[].user", "events.[].breadcrumbs", "events.[].request", "events.[].device"];
      var SESSION_FILTER_PATHS = ["device", "app", "user"];
      _$jsonPayload_13.report = function(report, filterKeys) {
        var payload = _$safeJsonStringify_22(report, null, null, {
          filterPaths: REPORT_FILTER_PATHS,
          filterKeys
        });
        if (payload.length > 1e6) {
          delete report.events[0].metaData;
          report.events[0].metaData = {
            notifier: "WARNING!\nSerialized payload was " + payload.length / 1e6 + "MB (limit = 1MB)\nmetaData was removed"
          };
          payload = _$safeJsonStringify_22(report, null, null, {
            filterPaths: REPORT_FILTER_PATHS,
            filterKeys
          });
          if (payload.length > 1e6) throw new Error("payload exceeded 1MB limit");
        }
        return payload;
      };
      _$jsonPayload_13.session = function(report, filterKeys) {
        var payload = _$safeJsonStringify_22(report, null, null, {
          filterPaths: SESSION_FILTER_PATHS,
          filterKeys
        });
        if (payload.length > 1e6) throw new Error("payload exceeded 1MB limit");
        return payload;
      };
      var http = require("http");
      var https = require("https");
      var ___require_26 = require("url"), parse = ___require_26.parse;
      var _$request_26 = function(_ref, cb) {
        var url2 = _ref.url, headers = _ref.headers, body = _ref.body, agent = _ref.agent;
        var didError = false;
        var onError = function(err) {
          if (didError) return;
          didError = true;
          cb(err);
        };
        var parsedUrl = parse(url2);
        var secure = parsedUrl.protocol === "https:";
        var transport = secure ? https : http;
        var req = transport.request({
          method: "POST",
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.path,
          headers,
          agent
        });
        req.on("error", onError);
        req.on("response", function(res) {
          bufferResponse(res, function(err, body2) {
            if (err) return onError(err);
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return onError(new Error("Bad statusCode from API: " + res.statusCode + "\n" + body2));
            }
            cb(null, body2);
          });
        });
        req.write(body);
        req.end();
      };
      var bufferResponse = function(stream, cb) {
        var data = "";
        stream.on("error", cb);
        stream.setEncoding("utf8");
        stream.on("data", function(d) {
          data += d;
        });
        stream.on("end", function() {
          return cb(null, data);
        });
      };
      ;
      var __isoDate_25 = _$esUtils_8.isoDate;
      ;
      var _$delivery_25 = function(client) {
        return {
          sendReport: function(report, cb) {
            if (cb === void 0) {
              cb = function() {
              };
            }
            var _cb = function(err) {
              if (err) client._logger.error("Report failed to send\u2026\n" + (err && err.stack ? err.stack : err), err);
              cb(err);
            };
            try {
              _$request_26({
                url: client.config.endpoints.notify,
                headers: {
                  "Content-Type": "application/json",
                  "Bugsnag-Api-Key": report.apiKey || client.config.apiKey,
                  "Bugsnag-Payload-Version": "4",
                  "Bugsnag-Sent-At": __isoDate_25()
                },
                body: _$jsonPayload_13.report(report, client.config.filters),
                agent: client.config.agent
              }, function(err, body) {
                return _cb(err);
              });
            } catch (e) {
              _cb(e);
            }
          },
          sendSession: function(session, cb) {
            if (cb === void 0) {
              cb = function() {
              };
            }
            var _cb = function(err) {
              if (err) client._logger.error("Session failed to send\u2026\n" + (err && err.stack ? err.stack : err), err);
              cb(err);
            };
            try {
              _$request_26({
                url: client.config.endpoints.sessions,
                headers: {
                  "Content-Type": "application/json",
                  "Bugsnag-Api-Key": client.config.apiKey,
                  "Bugsnag-Payload-Version": "1",
                  "Bugsnag-Sent-At": __isoDate_25()
                },
                body: _$jsonPayload_13.session(session, client.config.filters),
                agent: client.config.agent
              }, function(err) {
                return _cb(err);
              });
            } catch (e) {
              _cb(e);
            }
          }
        };
      };
      var _$process_1 = global.process;
      function ___extends_27() {
        ___extends_27 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_27.apply(this, arguments);
      }
      var schema = _$config_4.schema;
      var __reduce_27 = _$esUtils_8.reduce;
      var __stringWithLength_27 = _$validators_18.stringWithLength;
      var __os_27 = require("os");
      ;
      var _require4 = require("util"), inspect = _require4.inspect;
      var _$config_27 = {
        projectRoot: {
          defaultValue: function() {
            return _$process_1.cwd();
          },
          validate: function(value) {
            return value === null || __stringWithLength_27(value);
          },
          message: "should be string"
        },
        hostname: {
          defaultValue: function() {
            return __os_27.hostname();
          },
          message: "should be a string",
          validate: function(value) {
            return value === null || __stringWithLength_27(value);
          }
        },
        logger: ___extends_27({}, schema.logger, {
          defaultValue: function() {
            return getPrefixedConsole();
          }
        }),
        releaseStage: ___extends_27({}, schema.releaseStage, {
          defaultValue: function() {
            return _$process_1.env.NODE_ENV || "production";
          }
        }),
        agent: {
          defaultValue: function() {
            return void 0;
          },
          message: "should be an HTTP(s) agent",
          validate: function(value) {
            return value === void 0 || isAgent(value);
          }
        },
        onUncaughtException: {
          defaultValue: function() {
            return function(err, report, logger) {
              logger.error("Uncaught exception" + getContext(report) + ", the process will now terminate\u2026\n" + printError(err));
              _$process_1.exit(1);
            };
          },
          message: "should be a function",
          validate: function(value) {
            return typeof value === "function";
          }
        },
        onUnhandledRejection: {
          defaultValue: function() {
            return function(err, report, logger) {
              logger.error("Unhandled rejection" + getContext(report) + "\u2026\n" + printError(err));
            };
          },
          message: "should be a function",
          validate: function(value) {
            return typeof value === "function";
          }
        }
      };
      var printError = function(err) {
        return err && err.stack ? err.stack : inspect(err);
      };
      var getPrefixedConsole = function() {
        return __reduce_27(["debug", "info", "warn", "error"], function(accum, method) {
          var consoleMethod = console[method] || console.log;
          accum[method] = consoleMethod.bind(console, "[bugsnag]");
          return accum;
        }, {});
      };
      var getContext = function(report) {
        return report.request && Object.keys(report.request).length ? " at " + report.request.httpMethod + " " + (report.request.path || report.request.url) : "";
      };
      var isAgent = function(value) {
        return typeof value === "object" && value !== null || typeof value === "boolean";
      };
      var _$nodeFallbackStack_14 = {};
      _$nodeFallbackStack_14.getStack = function() {
        return new Error().stack.split("\n").slice(3).join("\n");
      };
      _$nodeFallbackStack_14.maybeUseFallbackStack = function(err, fallbackStack) {
        var lines = err.stack.split("\n");
        if (lines.length === 1 || lines.length === 2 && /at Error \(native\)/.test(lines[1])) {
          err.stack = lines[0] + "\n" + fallbackStack;
        }
        return err;
      };
      ;
      ;
      var _$reportFromError_16 = function(maybeError, handledState) {
        var actualError = _$iserror_11(maybeError) ? maybeError : new Error('Handled a non-error. See "error" tab for more detail.');
        var report = new _$BugsnagReport_23(actualError.name, actualError.message, _$BugsnagReport_23.getStacktrace(actualError), handledState, maybeError);
        if (maybeError !== actualError) report.updateMetaData("error", "non-error value", String(maybeError));
        return report;
      };
      var domain = require("domain");
      ;
      var getStack = _$nodeFallbackStack_14.getStack, maybeUseFallbackStack = _$nodeFallbackStack_14.maybeUseFallbackStack;
      var _$contextualize_29 = {
        name: "contextualize",
        init: function(client) {
          var contextualize = function(fn, opts) {
            var fallbackStack = getStack();
            var dom = domain.create();
            dom.on("error", function(err) {
              if (err.stack) maybeUseFallbackStack(err, fallbackStack);
              var report = _$reportFromError_16(err, {
                severity: "error",
                unhandled: true,
                severityReason: {
                  type: "unhandledException"
                }
              });
              client.notify(report, opts, function(e, report2) {
                if (e) client._logger.error("Failed to send report to Bugsnag");
                client.config.onUncaughtException(err, report2, client._logger);
              });
            });
            process.nextTick(function() {
              return dom.run(fn);
            });
          };
          return contextualize;
        }
      };
      ;
      var __getStack_30 = _$nodeFallbackStack_14.getStack, __maybeUseFallbackStack_30 = _$nodeFallbackStack_14.maybeUseFallbackStack;
      var _$intercept_30 = {
        name: "intercept",
        init: function(client) {
          var intercept = function(opts, cb) {
            if (cb === void 0) {
              cb = function() {
              };
            }
            if (typeof opts === "function") {
              cb = opts;
              opts = {};
            }
            var fallbackStack = __getStack_30();
            return function(err) {
              if (err) {
                if (err.stack) __maybeUseFallbackStack_30(err, fallbackStack);
                var report = _$reportFromError_16(err, {
                  severity: "warning",
                  unhandled: false,
                  severityReason: {
                    type: "callbackErrorIntercept"
                  }
                });
                client.notify(report, opts);
                return;
              }
              for (var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                data[_key - 1] = arguments[_key];
              }
              cb.apply(void 0, data);
            };
          };
          return intercept;
        }
      };
      function ___extends_31() {
        ___extends_31 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_31.apply(this, arguments);
      }
      var __isoDate_31 = _$esUtils_8.isoDate;
      var _$device_31 = {
        init: function(client) {
          var device = {
            hostname: client.config.hostname,
            runtimeVersions: {
              node: process.versions.node
            }
            // merge with anything already set on the client
          };
          client.device = ___extends_31({}, device, client.device);
          client.config.beforeSend.unshift(function(report) {
            report.device = ___extends_31({}, report.device, {
              time: __isoDate_31()
            });
          });
        }
      };
      var ___require_15 = require("path"), join = ___require_15.join, resolve = ___require_15.resolve;
      var _$pathNormalizer_15 = function(p) {
        return join(resolve(p), "/");
      };
      var __map_32 = _$esUtils_8.map;
      ;
      var _$inProject_32 = {
        init: function(client) {
          return client.config.beforeSend.push(function(report) {
            if (!client.config.projectRoot) return;
            var projectRoot = _$pathNormalizer_15(client.config.projectRoot);
            report.stacktrace = __map_32(report.stacktrace, function(stackframe) {
              stackframe.inProject = typeof stackframe.file === "string" && stackframe.file.indexOf(projectRoot) === 0 && !/\/node_modules\//.test(stackframe.file);
              return stackframe;
            });
          });
        }
      };
      function ___extends_33() {
        ___extends_33 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_33.apply(this, arguments);
      }
      function _inheritsLoose(subClass, superClass) {
        subClass.prototype = Object.create(superClass.prototype);
        subClass.prototype.constructor = subClass;
        subClass.__proto__ = superClass;
      }
      var SURROUNDING_LINES = 3;
      var MAX_LINE_LENGTH = 200;
      var ___require_33 = require("fs"), createReadStream = ___require_33.createReadStream;
      var ___require2_33 = require("stream"), Writable = ___require2_33.Writable;
      var pump = require_pump();
      var byline = require_byline();
      var _$surroundingCode_33 = {
        init: function(client) {
          if (!client.config.sendCode) return;
          var loadSurroundingCode = function(stackframe, cache) {
            return new Promise(function(resolve2, reject) {
              try {
                if (!stackframe.lineNumber || !stackframe.file) return resolve2(stackframe);
                var cacheKey = stackframe.file + "@" + stackframe.lineNumber;
                if (cacheKey in cache) {
                  stackframe.code = cache[cacheKey];
                  return resolve2(stackframe);
                }
                getSurroundingCode(stackframe.file, stackframe.lineNumber, function(err, code) {
                  if (err) return resolve2(stackframe);
                  stackframe.code = cache[cacheKey] = code;
                  return resolve2(stackframe);
                });
              } catch (e) {
                return resolve2(stackframe);
              }
            });
          };
          client.config.beforeSend.push(function(report) {
            return new Promise(function(resolve2, reject) {
              var cache = /* @__PURE__ */ Object.create(null);
              pMapSeries(report.stacktrace.map(function(stackframe) {
                return function() {
                  return loadSurroundingCode(stackframe, cache);
                };
              })).then(resolve2)["catch"](reject);
            });
          });
        },
        configSchema: {
          sendCode: {
            defaultValue: function() {
              return true;
            },
            validate: function(value) {
              return value === true || value === false;
            },
            message: "should be true or false"
          }
        }
      };
      var getSurroundingCode = function(file, lineNumber, cb) {
        var start = lineNumber - SURROUNDING_LINES;
        var end = lineNumber + SURROUNDING_LINES;
        var reader = createReadStream(file, {
          encoding: "utf8"
        });
        var splitter = new byline.LineStream({
          keepEmptyLines: true
        });
        var slicer = new CodeRange({
          start,
          end
        });
        slicer.on("done", function() {
          return reader.destroy();
        });
        pump(reader, splitter, slicer, function(err) {
          if (err && err.message !== "premature close") return cb(err);
          cb(null, slicer.getCode());
        });
      };
      var CodeRange = /* @__PURE__ */ (function(_Writable) {
        _inheritsLoose(CodeRange2, _Writable);
        function CodeRange2(opts) {
          var _this;
          _this = _Writable.call(this, ___extends_33({}, opts, {
            decodeStrings: false
          })) || this;
          _this._start = opts.start;
          _this._end = opts.end;
          _this._n = 0;
          _this._code = {};
          return _this;
        }
        var _proto = CodeRange2.prototype;
        _proto._write = function _write(chunk, enc, cb) {
          this._n++;
          if (this._n < this._start) return cb(null);
          if (this._n <= this._end) {
            this._code[String(this._n)] = chunk.length <= MAX_LINE_LENGTH ? chunk : chunk.substr(0, MAX_LINE_LENGTH);
            return cb(null);
          }
          this.emit("done");
          return cb(null);
        };
        _proto.getCode = function getCode() {
          return this._code;
        };
        return CodeRange2;
      })(Writable);
      var pMapSeries = function(ps) {
        return new Promise(function(resolve2, reject) {
          var res = [];
          ps.reduce(function(accum, p) {
            return accum.then(function(r) {
              res.push(r);
              return p();
            });
          }, Promise.resolve()).then(function(r) {
            res.push(r);
          }).then(function() {
            resolve2(res.slice(1));
          });
        });
      };
      ;
      var _handler;
      var _$uncaughtException_34 = {
        init: function(client) {
          if (!client.config.autoNotify) return;
          _handler = function(err) {
            client.notify(_$reportFromError_16(err, {
              severity: "error",
              unhandled: true,
              severityReason: {
                type: "unhandledException"
              }
            }), {}, function(e, report) {
              if (e) client._logger.error("Failed to send report to Bugsnag");
              client.config.onUncaughtException(err, report, client._logger);
            });
          };
          process.on("uncaughtException", _handler);
        },
        destroy: function() {
          process.removeListener("uncaughtException", _handler);
        }
      };
      ;
      var ___handler_35;
      var _$unhandledRejection_35 = {
        init: function(client) {
          if (!client.config.autoNotify) return;
          ___handler_35 = function(err) {
            client.notify(_$reportFromError_16(err, {
              severity: "error",
              unhandled: true,
              severityReason: {
                type: "unhandledPromiseRejection"
              }
            }), {}, function(e, report) {
              if (e) client._logger.error("Failed to send report to Bugsnag");
              client.config.onUnhandledRejection(err, report, client._logger);
            });
          };
          process.on("unhandledRejection", ___handler_35);
        },
        destroy: function() {
          process.removeListener("unhandledRejection", ___handler_35);
        }
      };
      function ___extends_6() {
        ___extends_6 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_6.apply(this, arguments);
      }
      var _$cloneClient_6 = function(client) {
        var clone = new client.BugsnagClient(client.notifier);
        clone.configure({});
        clone.config = client.config;
        clone.app = client.app;
        clone.context = client.context;
        clone.device = client.device;
        clone.breadcrumbs = client.breadcrumbs.slice();
        clone.metaData = ___extends_6({}, client.metaData);
        clone.request = ___extends_6({}, client.request);
        clone.user = ___extends_6({}, client.user);
        clone._logger = client._logger;
        clone._delivery = client._delivery;
        return clone;
      };
      var _$Backoff_36 = Backoff;
      function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 1e4;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
      }
      Backoff.prototype.duration = function() {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
          var rand = Math.random();
          var deviation = Math.floor(rand * this.jitter * ms);
          ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
      };
      Backoff.prototype.reset = function() {
        this.attempts = 0;
      };
      function ___inheritsLoose_38(subClass, superClass) {
        subClass.prototype = Object.create(superClass.prototype);
        subClass.prototype.constructor = subClass;
        subClass.__proto__ = superClass;
      }
      function _assertThisInitialized(self2) {
        if (self2 === void 0) {
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }
        return self2;
      }
      var DEFAULT_SUMMARY_INTERVAL = 10 * 1e3;
      var Emitter = require("events").EventEmitter;
      var _$tracker_38 = /* @__PURE__ */ (function(_Emitter) {
        ___inheritsLoose_38(SessionTracker, _Emitter);
        function SessionTracker(intervalLength) {
          var _this;
          _this = _Emitter.call(this) || this;
          _this._sessions = /* @__PURE__ */ new Map();
          _this._interval = null;
          _this._intervalLength = intervalLength || DEFAULT_SUMMARY_INTERVAL;
          _this._summarize = _this._summarize.bind(_assertThisInitialized(_assertThisInitialized(_this)));
          return _this;
        }
        var _proto = SessionTracker.prototype;
        _proto.start = function start() {
          if (!this._interval) {
            this._interval = setInterval(this._summarize, this._intervalLength).unref();
          }
        };
        _proto.stop = function stop() {
          clearInterval(this._interval);
          this._interval = null;
        };
        _proto.track = function track(session) {
          var key = dateToMsKey(session.startedAt);
          var cur = this._sessions.get(key);
          this._sessions.set(key, typeof cur === "undefined" ? 1 : cur + 1);
          return session;
        };
        _proto._summarize = function _summarize() {
          var _this2 = this;
          var summary = [];
          this._sessions.forEach(function(val, key) {
            summary.push({
              startedAt: key,
              sessionsStarted: val
            });
            _this2._sessions["delete"](key);
          });
          if (!summary.length) return;
          this.emit("summary", summary);
        };
        return SessionTracker;
      })(Emitter);
      var dateToMsKey = function(d) {
        var dk = new Date(d);
        dk.setSeconds(0);
        dk.setMilliseconds(0);
        return dk.toISOString();
      };
      function ___extends_37() {
        ___extends_37 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_37.apply(this, arguments);
      }
      var __isArray_37 = _$esUtils_8.isArray, __includes_37 = _$esUtils_8.includes;
      ;
      var __intRange_37 = _$validators_18.intRange;
      ;
      ;
      ;
      var _$session_37 = {
        init: function(client) {
          var sessionTracker = new _$tracker_38(client.config.sessionSummaryInterval);
          sessionTracker.on("summary", sendSessionSummary(client));
          sessionTracker.start();
          client.sessionDelegate({
            startSession: function(client2) {
              var sessionClient = _$cloneClient_6(client2);
              sessionClient._session = new client2.BugsnagSession();
              sessionTracker.track(sessionClient._session);
              return sessionClient;
            }
          });
        },
        configSchema: {
          sessionSummaryInterval: {
            defaultValue: function() {
              return void 0;
            },
            validate: function(value) {
              return value === void 0 || __intRange_37()(value);
            },
            message: "should be a positive integer"
          }
        }
      };
      var sendSessionSummary = function(client) {
        return function(sessionCounts) {
          var releaseStage = _$inferReleaseStage_10(client);
          if (__isArray_37(client.config.notifyReleaseStages) && !__includes_37(client.config.notifyReleaseStages, releaseStage)) {
            client._logger.warn("Session not sent due to releaseStage/notifyReleaseStages configuration");
            return;
          }
          if (!client.config.endpoints.sessions) {
            client._logger.warn("Session not sent due to missing endpoints.sessions configuration");
            return;
          }
          if (!sessionCounts.length) return;
          var backoff = new _$Backoff_36({
            min: 1e3,
            max: 1e4
          });
          var maxAttempts = 10;
          req(handleRes);
          function handleRes(err) {
            if (!err) {
              var sessionCount = sessionCounts.reduce(function(accum, s) {
                return accum + s.sessionsStarted;
              }, 0);
              return client._logger.debug(sessionCount + " session(s) reported");
            }
            if (backoff.attempts === 10) {
              client._logger.error("Session delivery failed, max retries exceeded", err);
              return;
            }
            client._logger.debug("Session delivery failed, retry #" + (backoff.attempts + 1) + "/" + maxAttempts, err);
            setTimeout(function() {
              return req(handleRes);
            }, backoff.duration());
          }
          function req(cb) {
            client._delivery.sendSession({
              notifier: client.notifier,
              device: client.device,
              app: ___extends_37({}, {
                releaseStage
              }, client.app),
              sessionCounts
            }, cb);
          }
        };
      };
      var __map_39 = _$esUtils_8.map;
      ;
      var _$stripProjectRoot_39 = {
        init: function(client) {
          return client.config.beforeSend.push(function(report) {
            if (!client.config.projectRoot) return;
            var projectRoot = _$pathNormalizer_15(client.config.projectRoot);
            report.stacktrace = __map_39(report.stacktrace, function(stackframe) {
              if (typeof stackframe.file === "string" && stackframe.file.indexOf(projectRoot) === 0) {
                stackframe.file = stackframe.file.replace(projectRoot, "");
              }
              return stackframe;
            });
          });
        }
      };
      var _$notifier_28 = {};
      function ___extends_28() {
        ___extends_28 = Object.assign || function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
        return ___extends_28.apply(this, arguments);
      }
      var name = "Bugsnag Node";
      var version = "6.5.2";
      var url = "https://github.com/bugsnag/bugsnag-js";
      ;
      ;
      ;
      ;
      ;
      var __schema_28 = ___extends_28({}, _$config_4.schema, _$config_27);
      delete __schema_28.autoBreadcrumbs;
      ;
      ;
      ;
      ;
      ;
      ;
      ;
      ;
      ;
      var plugins = [_$surroundingCode_33, _$inProject_32, _$stripProjectRoot_39, _$session_37, _$device_31, _$uncaughtException_34, _$unhandledRejection_35, _$intercept_30, _$contextualize_29];
      _$notifier_28 = function(opts, userPlugins) {
        if (userPlugins === void 0) {
          userPlugins = [];
        }
        if (typeof opts === "string") opts = {
          apiKey: opts
        };
        var bugsnag2 = new _$BugsnagClient_3({
          name,
          version,
          url
        });
        bugsnag2.delivery(_$delivery_25);
        bugsnag2.setOptions(opts);
        bugsnag2.configure(__schema_28);
        plugins.forEach(function(pl) {
          return bugsnag2.use(pl);
        });
        bugsnag2._logger.debug("Loaded!");
        bugsnag2.leaveBreadcrumb = function() {
          bugsnag2._logger.warn("Breadcrumbs are not supported in Node.js yet");
          return this;
        };
        return bugsnag2;
      };
      _$notifier_28.Bugsnag = {
        Client: _$BugsnagClient_3,
        Report: _$BugsnagReport_23,
        Session: _$Session_24,
        Breadcrumb: _$BugsnagBreadcrumb_2
        // Export a "default" property for compatibility with ESM imports
      };
      _$notifier_28["default"] = _$notifier_28;
      return _$notifier_28;
    });
  }
});

// node_modules/@bugsnag/js/node/notifier.js
var require_notifier = __commonJS({
  "node_modules/@bugsnag/js/node/notifier.js"(exports2, module2) {
    module2.exports = require_bugsnag();
  }
});

// src/lib/reporters/jest/index.js
var crypto = require("crypto");
var _compact = require_compact();
var _find = require_find();
var _findIndex = require_findIndex();
var _get = require_get();
var _identity = require_identity();
var _isEmpty = require_isEmpty();
var _pickBy = require_pickBy();
var stripAnsi = require_strip_ansi();
var hasAnsi = require_has_ansi();
var bugsnag = require_notifier();
var MockError = class extends Error {
  constructor(message, stack) {
    super(_get(stack.match(/(.+): (.+)/) || [], 2, "").trim());
    this.name = _get(stack.match(/(.+): (.+)/) || [], 1, "").trim();
    this.stack = stack;
  }
};
var PreventPlugin = class {
  init(client) {
    client.config.beforeSend.push(function(report) {
      return new Promise(function(resolve, reject) {
        report.ignore();
        resolve();
      });
    });
  }
};
var Base64TestReporter = class {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.feedbacks = [];
    this.reports = [];
    const bugsnagClient = bugsnag({
      apiKey: ".",
      autoNotify: false,
      autoCaptureSessions: false,
      logger: null,
      endpoints: {
        notify: "file://null",
        sessions: "file://null"
      }
    });
    bugsnagClient.use(new PreventPlugin());
    this.reporter = bugsnagClient;
  }
  parseOriginalFeedback(feedback) {
    if (!feedback) {
      return "";
    }
    const prefix = "[1m\x1B[31m  \x1B[1m\u25CF ";
    const hasPrefix = feedback.includes(prefix);
    this.feedbacks = feedback.split(prefix).filter((message) => {
      return message.replace(/\x1b/g, "").length;
    }).map((message) => {
      const match = stripAnsi(message).match(/^.+\b/)[0].trim();
      if (!match) {
        return false;
      }
      return {
        feedback,
        hasPrefix,
        test: match.replace(/(\x1b|›\s|●\s)/g, ""),
        message: hasPrefix ? `\x1B${prefix}${message}` : message
      };
    }).filter(Boolean);
  }
  async getFeedback(result) {
    if (result.status !== "failed") {
      return null;
    }
    try {
      return await new Promise((resolve, reject) => {
        let message = result.failureMessages[0];
        if (typeof message === "object") {
          message = message.stack;
        }
        const error = new MockError("", message);
        const feedback = this.transformFeedback(message, error);
        this.reporter.notify(error, {}, (err, report) => {
          if (err) {
            throw err;
          }
          resolve({
            content: _pickBy({
              title: error.name,
              [hasAnsi(feedback.message) ? "ansi" : "text"]: feedback.message,
              diff: feedback.diff,
              trace: this.transformTrace(report)
            }, _identity),
            type: "feedback"
          });
        });
      });
    } catch (_) {
      const feedback = _find(this.feedbacks, { test: result.fullName || result.title });
      return {
        content: feedback ? feedback.message : "",
        type: "ansi"
      };
    }
  }
  hash(string) {
    return crypto.createHash("sha1").update(string).digest("hex");
  }
  async transform(result, file) {
    if (["skipped", "pending", "todo"].includes(result.status)) {
      result.status = "incomplete";
    }
    return {
      ancestors: result.ancestorTitles,
      // For the purposes of assigning a unique ID to a test, ensure that
      // it is prefixed by the file path, even if it means repeating it.
      id: this.hash([file].concat(result.ancestorTitles, [result.title]).join("\xA6")),
      name: result.title,
      displayName: result.title,
      status: result.status,
      feedback: await this.getFeedback(result),
      stats: {
        duration: result.duration
        // @TODO: Assertions don't seem to be properly counted. Let's hold this
        // off until we can make sure it represents the actual test.
        // assertions: 0,
      },
      // Console output is per-suite, not per-test. We only get the file
      // and line number from Jest, so it can't be otherwise for now.
      console: []
    };
  }
  transformConsole(output) {
    if (!output) {
      return [];
    }
    return _compact(output.map((o) => {
      try {
        let file = o.origin.match(/\(([^\)]+)\:\d+\:\d+\)/mi);
        file = file ? file[1] : o.origin.replace(/:\d+$/mi, "");
        return {
          content: o.message,
          file,
          line: o.origin.slice(o.origin.indexOf(file) + file.length).replace(/^:(\d+)[\S\s]*/mi, "$1"),
          render: "ansi",
          type: o.type
        };
      } catch (error) {
        return null;
      }
    }));
  }
  transformTrace(report) {
    if (!report.stacktrace) {
      return null;
    }
    return _compact(report.stacktrace.map((frame) => {
      frame = _pickBy({
        file: _get(frame, "file", null),
        line: _get(frame, "lineNumber", null),
        code: _get(frame, "code", null)
      }, (property) => property !== null);
      return _isEmpty(frame) ? null : frame;
    }));
  }
  transformFeedback(feedback, error) {
    let diff = null;
    let message = feedback.replace(error.name ? new RegExp(`^${error.name}: `) : "", "").replace(/\n\s*at\s.+/gm, "");
    if (message.search(/\n(Difference:\s*)?\x1b.*\-\sExpected\s*.+/) > -1) {
      diff = {
        "@": stripAnsi(message).replace(/(.+)(\nDifference:\s*)?(\-\sExpected\s*.+)/s, "$3").replace(/\-\sExpected/, "--- Expected").replace(/\+\sReceived\n/, "+++ Received\n@@ @@")
      };
      message = message.replace(/\n(Difference:\s*)?\x1b.*\-\sExpected\s*(.+)/s, "");
    }
    return {
      message,
      diff
    };
  }
  async failedSuiteTest(result) {
    return await this.transform({
      ancestorTitles: [result.testFilePath],
      failureMessages: [result.testExecError],
      title: "Test suite failed to run",
      status: "failed"
    }, result.testFilePath);
  }
  group(suite, ungrouped) {
    const tests = [];
    ungrouped.forEach((result) => {
      let group = tests;
      if (result.ancestors.length) {
        let prefix = suite;
        result.ancestors.forEach((ancestor) => {
          const id = this.hash(`${prefix}\xA6${ancestor}`);
          let index = _findIndex(group, { id });
          prefix += `${ancestor}`;
          if (index === -1) {
            const test = {
              id,
              name: ancestor,
              displayName: ancestor,
              console: [],
              tests: []
            };
            group.push(test);
            index = _findIndex(group, { id: test.id });
          }
          group = group[index].tests;
        });
      }
      delete result.ancestors;
      group.push(result);
    });
    return tests;
  }
  async processTestResult(test, testResult, aggregatedResult) {
    this.parseOriginalFeedback(testResult.failureMessage);
    const logs = this.transformConsole(testResult.console);
    const tests = this.group(test.path, await Promise.all(testResult.testResults.map(async (result) => {
      return await this.transform(result, testResult.testFilePath);
    })));
    if (!tests.length && testResult.failureMessage) {
      tests.push(await this.failedSuiteTest(testResult));
    }
    const results = {
      file: test.path,
      tests,
      console: logs
    };
    if (this._globalConfig.useStderr) {
      results["raw"] = {
        test,
        testResult,
        aggregatedResult
      };
    }
    return results;
  }
  onTestResult(test, testResult, aggregatedResult) {
    this.reports.push(this.processTestResult(test, testResult, aggregatedResult).then((results) => {
      const encoded = Buffer.from(JSON.stringify(results)).toString("base64");
      console.log(`(${encoded})`);
    }));
  }
  onRunStart(results) {
    console.log("\n<<<REPORT{");
  }
  onRunComplete(contexts, results) {
    return new Promise((resolve, reject) => {
      Promise.all(this.reports).then(() => {
        console.log("\n}REPORT>>>");
        resolve();
      });
    });
  }
};
module.exports = Base64TestReporter;
