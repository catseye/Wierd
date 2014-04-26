PROGS=bin/wierd bin/wierd-milo
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

all: $(PROGS)

bin/.empty:
	mkdir -p bin
	touch bin/.empty

bin/wierd: bin/.empty src/wierd.c
	$(CC) $(CFLAGS) src/wierd.c -o bin/wierd

bin/wierd-milo: bin/.empty src/wierd-milo.c
	$(CC) $(CFLAGS) src/wierd-milo.c -o bin/wierd-milo

clean:
	rm -f *.o src/*.o *.core

distclean:
	rm -rf bin
