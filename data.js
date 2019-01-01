var json = [
	"(+ 1 2 3)",
	"(+ 1 2 (+ 3 4 5))",
	"(+ 1 2 (@f@ + 3 @1242@ 4 5))",
	`
		@
		 | comment is
		 | kakomu by
		 | attoma-ku
		@
		(
			+
			1
			2
		)
	`,
	"(let [a 5] {+ 2 $a})"
];
