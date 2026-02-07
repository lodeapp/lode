<?php

namespace LodeApp\PHPUnit;

use ArrayAccess;

class Util
{
    /**
     * Determine if a given key exists in a given array.
     *
     * @param \ArrayAccess|array $array
     * @param string|int $key
     */
    public static function exists($array, $key): bool
    {
        if ($array instanceof ArrayAccess) {
            return $array->offsetExists($key);
        }

        return array_key_exists($key, $array);
    }

    /**
     * Safely get the value from an array using its key,
     * with an optional fallback
     *
     * @param \ArrayAccess|array $array
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get($array, $key, $default = null)
    {
        if (is_null($key)) {
            return $array;
        }

        if (static::exists($array, $key)) {
            return $array[$key];
        }

        return $default;
    }

    /**
     * Remove falsey values from an (associative) array.
     *
     * @param array $array
     */
    public static function compact(array $array): array
    {
        foreach ($array as $key => $value) {
            if (!$value) {
                unset($array[$key]);
            }
        }
        return $array;
    }
}
