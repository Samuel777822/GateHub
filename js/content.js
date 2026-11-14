// Elite lecture courses, textbooks and quotes for GateHub.
// Lecture links point to verified video lectures (Nov 2026).
window.GH_CONTENT = {
  // GATE lecture plan. Step 1 ("primary") = MIT / Stanford / Harvard (or another
  // top university) course. Step 2 ("gap") = an NPTEL course, ONLY for GATE topics
  // step 1 doesn't cover. `watch` = [lecture numbers, what they cover]. Lecture
  // numbers are read from each playlist's own titles (Nov 2026).
  lectures: {
    ga: [],
    em: [
      { role: "primary", inst: "MIT", code: "18.06", title: "Linear Algebra", prof: "Gilbert Strang", url: "https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8", vids: 36, official: true, unit: "Lecture",
        watch: [["1–3", "Systems of linear equations, elimination, inverses"], ["4", "LU decomposition"], ["5–10", "Vector spaces, rank, solving Ax = b, independence"], ["18–20", "Determinants"], ["21, 22, 25", "Eigenvalues and eigenvectors"]] },
      { role: "primary", inst: "MIT", code: "18.01", title: "Single Variable Calculus", prof: "David Jerison", url: "https://www.youtube.com/playlist?list=PL590CCC2BC5AF3BC1", vids: 35, official: true, unit: "Lec",
        watch: [["1–6", "Limits, continuity, derivatives"], ["9–11", "Curve sketching, maxima and minima"], ["14", "Mean value theorem"], ["18–21", "Definite integrals"], ["27–30", "Integration techniques"], ["35–36", "L'Hôpital's rule, improper integrals"]] },
      { role: "primary", inst: "Harvard", code: "Stat 110", title: "Probability", prof: "Joe Blitzstein", url: "https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo", vids: 35, official: true, unit: "Lecture",
        watch: [["1–6", "Probability, counting, conditional probability, Bayes"], ["7–10", "Random variables, binomial, mean and variance"], ["11–14, 16", "Poisson, uniform, normal, exponential distributions"]] }
    ],
    dm: [
      { role: "primary", inst: "MIT", code: "6.1200J", title: "Mathematics for Computer Science", prof: "", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP61VNvICqk2HXJTonnKgAc9d", vids: 24, official: true, unit: "Lecture",
        watch: [["1–3", "Predicates, sets and proofs"], ["7", "Recurrences"], ["11–13", "Graph colouring, matching, connectivity, trees"], ["15–17", "Relations and counting"]] },
      { role: "gap", inst: "IIT Madras", code: "NPTEL", title: "Discrete Mathematical Structures", prof: "Kamala Krithivasan", url: "https://www.youtube.com/playlist?list=PL0862D1A947252D20", vids: 40, official: true, unit: "Lecture",
        watch: [["1–4", "Propositional and first-order logic (GATE depth)"], ["21–23", "Partial orders and equivalence relations"], ["24–26", "Functions"], ["30–31", "Generating functions"], ["35–37", "Monoids and groups"], ["40", "Lattices"]] }
    ],
    dl: [
      { role: "primary", inst: "MIT", code: "6.004", title: "Computation Structures", prof: "", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP62WVs95MNq3dQBqY2vGOtQ2", vids: 172, official: true, unit: "Section",
        watch: [["1.2.x", "Binary encoding, two's complement"], ["4.2.x", "Boolean logic, sum of products, K-maps, multiplexers"], ["5.2.x", "Latches, registers, sequential timing"], ["6.2.x", "Finite state machines"], ["8.2.x", "Adders and multipliers"]] },
      { role: "gap", inst: "IIT Kharagpur", code: "NPTEL", title: "Switching Circuits and Logic Design", prof: "Indranil Sengupta", url: "https://www.youtube.com/playlist?list=PLbRMhDVUMngfV8C6ElNAUaQQz06wEhFM5", vids: 61, official: true, unit: "Lecture",
        watch: [["02–05", "Number systems, conversions, BCD and Gray codes"], ["15", "Functional completeness"], ["19–20", "Quine–McCluskey minimisation"], ["31–33", "Flip-flops: SR, JK, D, T"], ["45–46", "Counters"]] },
      { role: "gap", inst: "IIT Kharagpur", code: "NPTEL", title: "Computer Architecture and Organisation", prof: "Indranil Sengupta & Kamalika Datta", url: "https://www.youtube.com/playlist?list=PL-8LShlBMIjUuI9beQJHZUF14we25NToB", vids: 63, official: true, unit: "Video",
        watch: [["38–39", "Floating point (IEEE 754)"]] }
    ],
    co: [
      { role: "primary", inst: "CMU", code: "18-447", title: "Computer Architecture", prof: "Onur Mutlu", url: "https://www.youtube.com/playlist?list=PL5PHm2jkkXmi5CxxI7b3JCL1TWybTDtKq", vids: 39, official: true, unit: "Lecture",
        watch: [["2–4", "Instruction set architecture"], ["5–6", "Datapath and microarchitecture"], ["7–8", "Pipelining and hazards"], ["17–20", "Caches and virtual memory"], ["21", "Main memory (DRAM)"]] },
      { role: "gap", inst: "IIT Kharagpur", code: "NPTEL", title: "Computer Architecture and Organisation", prof: "Indranil Sengupta & Kamalika Datta", url: "https://www.youtube.com/playlist?list=PL-8LShlBMIjUuI9beQJHZUF14we25NToB", vids: 63, official: true, unit: "Video",
        watch: [["6", "Instruction formats and addressing modes"], ["16–19", "Hardwired and microprogrammed control unit"], ["43", "Secondary storage (disks)"], ["44–48", "I/O, interrupts and DMA"]] }
    ],
    pl: [
      { role: "primary", inst: "Harvard", code: "CS50x", title: "Introduction to Computer Science", prof: "David J. Malan", url: "https://www.youtube.com/playlist?list=PLhQjrBD2T383q7Vn8QnTsVgSvyLpsqL_R", vids: 13, official: true, unit: "Lecture",
        watch: [["1", "C basics"], ["2", "Arrays and strings"], ["3", "Recursion, searching and sorting"], ["4", "Pointers and memory"], ["5", "Linked lists, stacks, queues, trees"]] }
    ],
    ds: [
      { role: "primary", inst: "Harvard", code: "CS50x", title: "Introduction to Computer Science", prof: "David J. Malan", url: "https://www.youtube.com/playlist?list=PLhQjrBD2T383q7Vn8QnTsVgSvyLpsqL_R", vids: 13, official: true, unit: "Lecture",
        watch: [["2", "Arrays"], ["5", "Linked lists, stacks, queues, trees, hash tables"]] },
      { role: "primary", inst: "MIT", code: "6.006", title: "Introduction to Algorithms", prof: "Erik Demaine, Jason Ku & Justin Solomon", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY", vids: 32, official: true, unit: "Lecture",
        watch: [["4", "Hashing"], ["6–7", "Binary search trees and AVL trees"], ["8", "Binary heaps"], ["9–10", "Graphs: BFS and DFS"]] }
    ],
    algo: [
      { role: "primary", inst: "MIT", code: "6.006", title: "Introduction to Algorithms", prof: "Erik Demaine, Jason Ku & Justin Solomon", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY", vids: 32, official: true, unit: "Lecture",
        watch: [["1", "Asymptotic analysis"], ["3–5", "Searching, sorting, hashing"], ["8", "Heapsort"], ["9–10", "BFS, DFS, topological sort"], ["11–14", "Shortest paths: Bellman-Ford, Dijkstra"], ["15–18", "Dynamic programming"]] },
      { role: "primary", inst: "MIT", code: "6.046J", title: "Design and Analysis of Algorithms", prof: "Erik Demaine, Srini Devadas & Nancy Lynch", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP6317WaSNfmCvGym2ucw3oGp", vids: 34, official: true, unit: "Lecture",
        watch: [["2 + R1", "Divide and conquer, master theorem"], ["6", "Quicksort"], ["12 + R6", "Greedy algorithms, minimum spanning trees"]] }
    ],
    toc: [
      { role: "primary", inst: "MIT", code: "18.404J", title: "Theory of Computation", prof: "Michael Sipser", url: "https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY", vids: 25, official: true, unit: "Lecture",
        watch: [["1–3", "DFA, NFA, regular expressions, pumping lemma"], ["4–5", "Context-free grammars, PDAs, CFL pumping lemma"], ["5–6", "Turing machines"], ["7–10", "Decidability and undecidability"]] }
    ],
    cd: [
      { role: "primary", inst: "Stanford", code: "Compilers", title: "Compilers", prof: "Alex Aiken", url: "https://www.youtube.com/playlist?list=PLxoiCo5tGquBZzK0E_-JVLSV3b3o_2OnX", vids: 126, official: false, unit: "Video",
        watch: [["03-01 to 04-05", "Lexical analysis, regex to NFA to DFA"], ["05-01 to 07-04", "Grammars, ambiguity, LL(1) parsing, FIRST and FOLLOW"], ["07-05 to 08-08", "Bottom-up parsing, LR(0) items, SLR"], ["11-01 to 11-06", "Runtime environments, activation records"], ["14-01 to 15-01", "Intermediate code, local optimisation, data-flow analysis"]] },
      { role: "gap", inst: "IISc", code: "NPTEL", title: "Principles of Compiler Design", prof: "Y. N. Srikant", url: "https://www.youtube.com/playlist?list=PLbMVogVj5nJQNjkHZgwuAlfQ9tzmQDxjA", vids: 40, official: true, unit: "Lec",
        watch: [["09–11", "LR(1) (CLR) and LALR parsing"], ["12–16", "Syntax-directed translation"], ["17–20", "Three-address code generation"]] }
    ],
    os: [
      { role: "primary", inst: "Berkeley", code: "CS162", title: "Operating Systems", prof: "", url: "https://www.youtube.com/playlist?list=PLRNgaiQ-qhKbYG-JkCv6am7LxhMMa_enm", vids: 27, official: false, unit: "Lecture",
        watch: [["2–5", "System calls, processes, threads, IPC"], ["6–9", "Synchronisation, semaphores, monitors"], ["10–11", "CPU scheduling"], ["12", "Deadlock, Banker's algorithm"], ["13–17", "Paging, TLBs, virtual memory, page replacement"], ["17–18", "I/O and disks"], ["19–21", "File systems"]] }
    ],
    db: [
      { role: "primary", inst: "Stanford", code: "Databases", title: "Introduction to Databases", prof: "Jennifer Widom", url: "https://www.youtube.com/playlist?list=PLroEs25KGvwzmvIxYHRhoGTz9w8LeXek0", vids: 58, official: false, unit: "Video",
        watch: [["2, 9–10", "Relational model, relational algebra"], ["11–19", "SQL"], ["20–24", "Functional dependencies, BCNF, 4NF"], ["34–35", "Constraints, referential integrity"]] },
      { role: "primary", inst: "CMU", code: "15-445", title: "Database Systems", prof: "Andy Pavlo", url: "https://www.youtube.com/playlist?list=PLSE8ODhjZXjYDBpQnSymaectKjxCy6BYq", vids: 26, official: true, unit: "#",
        watch: [["03–06", "File organisation and storage"], ["08", "B+ trees"], ["16–17", "Serializability, two-phase locking"]] },
      { role: "gap", inst: "IIT Kharagpur", code: "NPTEL", title: "Database Management System", prof: "Partha Pratim Das", url: "https://www.youtube.com/playlist?list=PLIwC9bZ0rmjSkm1VRJROX4vP2YMIf4Ebh", vids: 46, official: true, unit: "Video",
        watch: [["11", "Tuple and domain relational calculus"], ["12–14", "ER model"], ["16–20", "3NF, lossless-join and dependency-preserving decomposition"], ["34", "Recoverable and cascadeless schedules"]] }
    ],
    cn: [
      { role: "primary", inst: "Stanford", code: "CS144", title: "Introduction to Computer Networking", prof: "Nick McKeown & Philip Levis", url: "https://www.youtube.com/playlist?list=PL6RdenZrxrw9inR-IJv-erlOKRHjymxMN", vids: 145, official: false, unit: "Video",
        watch: [["3–8", "Layering, IP service model, packet switching, encapsulation"], ["13–20", "IPv4 addressing, CIDR and longest-prefix match, ARP"], ["23–38", "TCP, UDP, ICMP, error detection, stop-and-wait, sliding window"], ["54–66", "Congestion control"], ["67–83", "NAT, HTTP, DNS, DHCP"], ["84–88", "Routing: flooding, distance vector, link state"]] },
      { role: "gap", inst: "IIT Kharagpur", code: "NPTEL", title: "Computer Networks and Internet Protocol", prof: "Soumya Kanti Ghosh & Sandip Chakraborty", url: "https://www.youtube.com/playlist?list=PLbRMhDVUMngf-peFloB7kyiA40EptH1up", vids: 61, official: true, unit: "Lecture",
        watch: [["2", "Circuit, packet and virtual-circuit switching"], ["7", "FTP"], ["10", "Email (SMTP)"], ["46–50", "Data link layer: framing, Ethernet, CSMA/CD, flow and error control"]] }
    ],
    se: [], web: []
  },

  gateNotes: {
    em: "Mean, median and mode are one-line definitions; the worked PYQ solutions cover them.",
    os: "Disk scheduling (FCFS, SSTF, SCAN) is in CS162 Lecture 18 and in the PYQ solutions."
  },

  books: {
    ga: ["GATE Overflow aptitude PYQs", "R. S. Aggarwal — Quantitative Aptitude"],
    em: ["Gilbert Strang — Introduction to Linear Algebra", "Sheldon Ross — A First Course in Probability", "Erwin Kreyszig — Advanced Engineering Mathematics"],
    dm: ["Kenneth Rosen — Discrete Mathematics and Its Applications", "Lehman, Leighton & Meyer — Mathematics for Computer Science (MIT, free)"],
    dl: ["M. Morris Mano — Digital Design"],
    co: ["Hamacher — Computer Organization", "Patterson & Hennessy — Computer Organization and Design"],
    pl: ["Kernighan & Ritchie — The C Programming Language"],
    ds: ["Cormen et al. — Introduction to Algorithms (CLRS)", "Tanenbaum — Data Structures Using C"],
    algo: ["Cormen, Leiserson, Rivest & Stein — Introduction to Algorithms (CLRS)", "Kleinberg & Tardos — Algorithm Design"],
    toc: ["Michael Sipser — Introduction to the Theory of Computation", "Hopcroft, Motwani & Ullman — Automata Theory"],
    cd: ["Aho, Lam, Sethi & Ullman — Compilers (the Dragon Book)"],
    os: ["Silberschatz, Galvin & Gagne — Operating System Concepts", "Arpaci-Dusseau — OSTEP"],
    db: ["Silberschatz, Korth & Sudarshan — Database System Concepts", "Elmasri & Navathe — Fundamentals of Database Systems"],
    cn: ["Kurose & Ross — Computer Networking: A Top-Down Approach", "Tanenbaum — Computer Networks", "Forouzan — Data Communications and Networking"],
    se: [], web: []
  },

  numerals: { ga: "I", em: "II", dm: "III", dl: "IV", co: "V", pl: "VI", ds: "VII", algo: "VIII", toc: "IX", cd: "X", os: "XI", db: "XII", cn: "XIII", se: "XIV", web: "XV" },

  glyphs: { ga: "Ω", em: "∫", dm: "∀", dl: "⊕", co: "⚙", pl: "{ }", ds: "⋔", algo: "Θ", toc: "Σ*", cd: "⊢", os: "λ", db: "⋈", cn: "⇄", se: "≡", web: "◎" },

  quotes: [
    ["Premature optimization is the root of all evil.", "Donald Knuth"],
    ["We can only see a short distance ahead, but we can see plenty there that needs to be done.", "Alan Turing"],
    ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
    ["The best way to predict the future is to invent it.", "Alan Kay"],
    ["Talk is cheap. Show me the code.", "Linus Torvalds"],
    ["The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.", "Edsger W. Dijkstra"],
    ["An expert is a person who has made all the mistakes that can be made in a very narrow field.", "Niels Bohr"],
    ["It always seems impossible until it's done.", "Nelson Mandela"],
    ["The function of education is to teach one to think intensively and to think critically.", "Martin Luther King Jr."],
    ["Controlling complexity is the essence of computer programming.", "Brian Kernighan"],
    ["Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson"],
    ["Science is what we understand well enough to explain to a computer. Art is everything else we do.", "Donald Knuth"]
  ]
};
