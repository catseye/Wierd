The Wierd Programming Language
==============================

This is Cat's Eye Technologies' distribution of Wierd, a two-dimensional
esoteric programming language (a "fungeoid".)  Unlike related languages,
the symbols in a Wierd program do not determine which instructions are
executed; instead, any symbols may be used to draw chains of symbols, and
it is the *bends* in these chains which determine which instructions are
executed.

History
-------

Wierd has a long and colourful history of language fuzziness.

Wierd was originally designed by Ben Olmstead, John Colagioia, and Chris
Pressey, in a three-way email discussion about how Befunge and Brainfuck
could be combined in an interesting way.

Based on this discussion, John wrote an implementation of Wierd in C
(`wierd.c` in the `src` directory), and wrote a version of the classic
"Hello, world!" program in Wierd (`hello.w` in the `eg` directory; see
also his description of the program in `hellow.txt` in the `doc` directory.)

Then, based largely on this implementation, John wrote a specification for
the language (`wierdspec.txt` in the `doc` subdirectory.)

Later on, Milo van Handel also wrote an implementation (`wierd-milo.c`
in `src`) and several example Wierd programs (in `eg` -- they're the ones
described in `*.doc.txt` in `doc`) for it -- including a Wierd/INTERCAL
polyglot (`polyglot.i`).

Unfortunately, Milo's interpreter has different semantics from John's
interpreter -- from what I've been able to tell, the two programs implement
largely incompatible languages.  It may be possible to write programs which
work the same on both interpreters, but I'm pretty sure none of the included
example programs do.

Milo's Wierd could reasonably be called "Wierd 2.0", but as far as I know,
no one does.

Later still, Chris attempted to implement the original Wierd in the
[yoob][] framework, based on John's spec, but when trying to run `hello.w`
on it, found that it would only get so far before entering an infinite loop
(back and forth along the chain.)  This suggests a possible bug in either
the yoob implementation or in `wierd.c` or in the spec.

Given all this, it is really doubtful that any of these implementations or
documents can be considered normative.

Chris also recently patched Milo's implementation to take standard long
options, for portability (NetBSD doesn't have `getopt_long_only`.)  (Sorry
Milo, hope you don't mind.)

[yoob]: http://catseye.tc/projects/yoob/

License
-------

The Wierd distribution's licensing matches the language's fuzziness.

With the exception of Milo's `quine.w`, which is licensed under the GPL
(no version specified), no license was ever explicitly placed on any of the
sources, so they are all implicitly copyright by their respective authors.

However, Cat's Eye Technologies has been redistributing these sources in
the form of this Wierd distribution for years now, with no objections from
the authors, so I think it's safe to consider them to be freely
redistributable, unmodified and for non-commercial purposes; however, I am
not a lawyer, your mileage may vary, caveat emptor, etc. etc.
