<?php

namespace LodeApp\PHPUnit;

use PHPUnit\TextUI\ResultPrinter;

/**
 * In subsequent versions of PHPUnit, the ResultPrinter became an interface,
 * so we need to override Lode's default Printer class in PHPUnit 7 & 8,
 * which will reference the previous default printer class.
 */
class Printer extends ResultPrinter
{
}
