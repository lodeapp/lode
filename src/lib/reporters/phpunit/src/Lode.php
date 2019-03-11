<?php

namespace LodeApp\PHPUnit;

class Lode
{
    /**
     * The current globally available container (if any).
     *
     * @var static
     */
    protected static $instance;

    /**
     * The shared instances.
     *
     * @var array
     */
    protected $shares = [];

    /**
     * Create a new Lode container.
     */
    public function __construct()
    {
        $this->share(new Console);
    }

    /**
     * Resolve the given type from the container. Will instatiate
     * and set the container if it's not yet available.
     *
     * @param  string  $abstract
     * @return mixed
     */
    public static function make($abstract)
    {
        if (is_null(static::$instance)) {
            static::$instance = new static;
        }

        return call_user_func_array([static::$instance, 'resolve'], [$abstract]);
    }

    /**
     * Normalize a class name.
     *
     * @param  string  $abstract
     * @return mixed
     */
    protected function normalizeName($className)
    {
        return ltrim(strtolower($className), '\\');
    }

    /**
     * Share an instance through the container.
     *
     * @param  string  $abstract
     * @return mixed
     */
    protected function share($obj)
    {
        $normalizedName = $this->normalizeName(get_class($obj));
        $this->shares[$normalizedName] = $obj;
    }

    /**
     * Return th shared class from the container.
     *
     * @param  string  $abstract
     * @return mixed
     */
    protected function resolve($abstract)
    {
        $normalizedClass = $this->normalizeName($abstract);
        if (isset($this->shares[$normalizedClass])) {
            return $this->shares[$normalizedClass];
        }

        return null;
    }
}
