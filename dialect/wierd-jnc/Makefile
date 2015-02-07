PROGS=bin/wierd-jnc
CC?=gcc

WARNS=	-W -Wall -Wstrict-prototypes -Wmissing-prototypes \
	-Wpointer-arith	-Wno-uninitialized -Wreturn-type -Wcast-qual \
	-Wwrite-strings -Wswitch -Wcast-align -Wchar-subscripts \
	-Winline -Wnested-externs -Wredundant-decls

ifdef ANSI
  CFLAGS+= -ansi -pedantic
else
  CFLAGS+= -std=c99 -D_POSIX_C_SOURCE=200112L
endif

CFLAGS+= ${WARNS} ${EXTRA_CFLAGS}

ifdef DEBUG
  CFLAGS+= -g
endif

.PHONY: all clean distclean

all: $(PROGS)

bin/.empty:
	mkdir -p bin
	touch bin/.empty

bin/wierd-jnc: bin/.empty src/wierd.c
	$(CC) $(CFLAGS) src/wierd.c -o $@

clean:
	rm -f src/*.o *.core

distclean: clean
	rm -rf bin
