The Wierd Programming Language
==============================

This is Cat's Eye Technologies' distribution of Wierd, a two-dimensional
esoteric programming language (a "fungeoid".)  Unlike similar languages
where the symbols in a program determine which instructions are executed,
in Wierd, it is the *bends* in the chain of arbitrary symbols that determine
which instructions are executed.

History
-------

Wierd has a long and colourful history of language fuzziness.

Wierd was originally designed by Ben Olmstead, John Colagioia, and Chris
Pressey, in a three-way email discussion about how [Befunge][] and [brainfuck][]
could be combined in an interesting way.

Based on this discussion, John wrote an interpreter in C for his interpretation
of Wierd (which, as comments in its source code explain, differs from "official"
Wierd), and wrote a version of the classic "Hello, world!" program which runs
on his interpreter.

Later on, based on his implementation, John wrote a specification for the
language accepted by his interpreter, calling it Wierd.

Even later on, Milo van Handel (who was not privy to the email conversation)
wrote an interpreter, also in C, for his interpretation of Wierd, which was
apparenly based largely on John's interpreter and spec, but interpreting some
conditions slightly differently, and filling in some gaps (such as treatment
of EOF.)  Milo also wrote several example programs that run on his interpreter,
including several versions of the classic `cat` program and a Wierd/INTERCAL
polyglot.

Unfortunately, the language implemented by Milo's interpreter has different
semantics from the language implemented by John's interpreter — and from what
I've been able to tell, the two languages are largely incompatible.  It may of
course be possible to write polyglot programs which are accepted by both
interpreters, perhaps even having the same behaviour in both, but I'm pretty
sure that none of the included example programs fall into this category.

Later still, Chris attempted to implement John's interpretation of Wierd in the
[yoob][] framework, based on John's spec, but when trying to run `hello.w`
on it, found that it would only get so far before entering an infinite loop
(back and forth along the chain.)  This suggested a possible bug in either
the yoob implementation or in `wierd.c` or in the spec.

Shortly after this, Chris also patched Milo's implementation to take standard
long options, for portability (NetBSD doesn't have `getopt_long_only`.)  (Sorry
Milo, hope you don't mind.)

Shortly after *that*, Chris began writing an interpreter in Javascript,
using the [yoob.js][] framework, of John's interpretation of Wierd, and
discovered the source of the problems with his previous attempt: `hello.w`
relies on incorrectly-documented behaviour.  Specifically, while John's spec
*and* the comments in John's interpreter say that during the "putget" operation,
a zero value means "get" and a non-zero value means "put", in the
implementation, it is actually the other way around.

### Given all this... ###

Given all this, well, here's how I see it.

The name _Wierd_ refers to the language defined (however fuzzily) by that
original email conversation.

Given that that email thread is, as far as I know, lost and gone forever,
Wierd has no specification, and no reference implementation.  (Therefore,
there are no `src`, `doc`, or `eg` directories in the root directory of this
repository.)

Both John Colagioia and Milo van Handel designed and implemented _dialects_ of
Wierd.  (Therefore there is a directory called `dialect` in this repository.)
I have tended to call them "John's Wierd" and "Milo's Wierd" in the
past, but anything else that distinguishes them by the name of their author
would suffice.  (Therefore there are subdirectories `dialect/wierd-jnc` and
`dialect/wierd-mvh` in this repository, and each of *those* contains the
standard `src`, `doc`, and `eg` subdirectories.  And in addition, because
Chris's interpreter implements John's Wierd, it is in the `impl` directory
of `dialect/wierd-jnc`.  It is also [installed online at catseye.tc][].)

And in light of all this, it might also be acceptable to consider Wierd to be
a language *family* rather than a language.  I'm not yet decided on this point.

### Pull Requests ###

You are perfectly welcome to open pull requests on this repository, but please
observe the layout described above:

*   implementations of John's Wierd go into `dialect/wierd-jnc/impl`
*   example programs in John's Wierd go into `dialect/wierd-jnc/eg`
*   implementations of Milo's Wierd go into `dialect/wierd-mvh/impl`
*   example programs in Milo's Wierd go into `dialect/wierd-mvh/eg`
*   any other dialects of Wierd go into `dialect/your-dialect-name`

In light of the following section, I would also ask that you provide some
license information regarding any sources you submit.  Open-source licensing
would definitely be preferable.

License
-------

The Wierd distribution's licensing matches the language's fuzziness.

With the exception of Milo's `quine.w`, which is licensed under the GPL
(no version specified), no license was ever explicitly placed on any of John's
or Milo's sources or documentation, so they are all implicitly copyrighted by
their respective authors.

However, Cat's Eye Technologies has been redistributing these sources in
the form of this Wierd distribution for years now, with no objections from
the authors, so I think it's safe to consider them to be freely
redistributable, unmodified and for non-commercial purposes; however, I am
not a lawyer, your mileage may vary, caveat emptor, etc. etc.

In stark (I hope) contrast to this, Chris's implementation, `wierd-jnc.js`, is
placed into the public domain (see the file `UNLICENSE` in its directory.)

- - - -

[Befunge]: http://catseye.tc/node/Befunge-93
[brainfuck]: http://catseye.tc/node/brainfuck
[yoob]: http://catseye.tc/node/yoob
[yoob.js]: http://catseye.tc/node/yoob.js
[installed online at catseye.tc]: http://catseye.tc/installation/Wierd_%28John_Colagioia%29
