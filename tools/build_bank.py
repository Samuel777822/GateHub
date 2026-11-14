"""Builds data/bank.json from data/questions.json.

Adds a topic layer under every chapter (subject -> chapter -> topic -> questions)
using a curated topic map: a question goes to the first topic whose tags or
keywords match, otherwise to the chapter's "Mixed Problems" topic.

Run:  py -I tools/build_bank.py
"""
import json, re, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "questions.json"
OUT = ROOT / "data" / "bank.json"

# (topic name, tags, keyword regex on question text) — order matters: first match wins.
T = {
 "ga/verbal-ability": [
  ("Reading Comprehension", ["passage-reading"], r"passage|paragraph"),
  ("Grammar & Usage", ["english-grammar", "tenses", "grammatical-error", "articles", "comparative-forms"], r"grammatical|error|tense"),
  ("Vocabulary & Word Meaning", ["most-appropriate-word", "synonyms", "antonyms", "word-meaning", "phrase-meaning", "word-pairs"], r"closest in meaning|opposite|meaning|fill|blank"),
  ("Verbal Reasoning", ["verbal-reasoning", "statements-follow", "sentence-ordering", "logical-reasoning", "analytical-aptitude"], None),
  ("Spatial Questions", ["spatial-aptitude", "image-rotation"], None)],
 "ga/numerical-ability": [
  ("Data Interpretation", ["data-interpretation", "tabular-data", "bar-graph", "pie-chart"], r"table|chart|graph"),
  ("Probability & Counting", ["probability", "combinatory"], r"probabilit|ways|arrange"),
  ("Geometry & Mensuration", ["geometry", "area", "triangles"], r"circle|triangle|area|square|radius"),
  ("Ratio, Percentage & Work", ["ratio-proportion", "percentage", "cost-market-price", "work-time"], r"ratio|percent|%|profit|price|days to"),
  ("Algebra, Numbers & Series", ["logarithms", "quadratic-equations", "sequence-series", "functions", "factors", "numerical-computation", "maxima-minima", "venn-diagram"], None)],
 "ga/logical-reasoning": [
  ("Spatial & Pattern Reasoning", ["spatial-aptitude", "paper-folding", "patterns-in-two-dimensions", "patterns-in-three-dimensions", "3d-structure", "assembling-pieces", "contour-plots"], None),
  ("Direction Sense", ["direction-sense"], r"north|south|east|west"),
  ("Statements & Data Sufficiency", ["statement-sufficiency", "statements-follow"], r"statement|conclusion|sufficient"),
  ("Logical Reasoning", ["logical-reasoning", "analytical-aptitude", "number-relations", "venn-diagram", "word-pairs"], None)],
 "ga/spatial-aptitude": [("Paper Folding & Spatial", ["spatial-aptitude"], None)],
 "em/linear-algebra": [
  ("Eigenvalues & Eigenvectors", ["eigen-value"], r"eigen"),
  ("Systems of Linear Equations", ["system-of-equations"], r"system of|solution|equations"),
  ("Determinants", ["determinant"], r"determinant|det\b"),
  ("Rank & Vector Spaces", ["rank-of-matrix", "vector-space"], r"\brank\b|vector space|linearly independent"),
  ("LU Decomposition", ["lu-decomposition"], r"\bLU\b"),
  ("Matrix Properties", ["matrix"], None)],
 "em/calculus": [
  ("Limits", ["limits"], r"\\lim|limit"),
  ("Continuity & Differentiability", ["continuity", "differentiable", "differentiation"], r"continu|differentiab|derivative"),
  ("Maxima & Minima", ["maxima-minima"], r"maxim|minim"),
  ("Integration", ["integration", "definite-integral"], r"\\int|integra")],
 "em/probability": [
  ("Conditional Probability & Bayes", ["conditional-probability", "bayes-theorem", "independent-events"], r"given that|conditional|independent"),
  ("Random Variables & Expectation", ["random-variable", "expectation"], r"expect|variance|random variable|mean"),
  ("Probability Distributions", ["uniform-distribution", "binomial-distribution", "poisson-distribution", "normal-distribution", "exponential-distribution", "continuous-distribution", "probability-distribution"], r"distribut|poisson|binomial|uniform"),
  ("Statistics", ["statistics"], r"median|mode|standard deviation"),
  ("Basic Probability", ["probability"], None)],
 "dm/mathematical-logic": [
  ("First-Order Logic", ["first-order-logic"], r"\\forall|\\exists|∀|∃|predicate"),
  ("Propositional Logic", ["propositional-logic", "functional-completeness", "conjunctive-normal-form", "valid", "unsatisfiable"], None)],
 "dm/set-theory-and-algebra": [
  ("Groups & Algebraic Structures", ["group-theory"], r"group|monoid|semigroup|abelian|identity element|\bring\b|binary operation"),
  ("Lattices & Partial Orders", [], r"lattice|poset|partial order|hasse|partially ordered|boolean algebra"),
  ("Relations", ["relations"], r"relation|reflexive|symmetric|transitive|equivalence"),
  ("Functions", ["functions"], r"function|injective|surjective|bijecti|one-to-one|onto"),
  ("Countability", [], r"countabl|uncountabl|cardinality"),
  ("Sets", [], r"\bset|subset|power set")],
 "dm/combinatorics": [
  ("Recurrence Relations", ["recurrence-relation"], r"recurrence|a_n|a_\{n"),
  ("Generating Functions", ["generating-functions"], r"generating function"),
  ("Pigeonhole Principle", ["pigeonhole-principle"], r"pigeonhole"),
  ("Counting & Permutations", ["combinatory", "counting", "balls-in-bins", "catalan-number", "summation"], None)],
 "dm/graph-theory": [
  ("Graph Colouring", ["graph-coloring"], r"colou?r|chromatic"),
  ("Planarity", ["graph-planarity"], r"planar|faces"),
  ("Isomorphism", ["graph-isomorphism"], r"isomorph"),
  ("Matching, Covers & Cliques", [], r"matching|vertex cover|independent set|clique|edge cover"),
  ("Degree & Counting Graphs", ["degree-of-graph"], r"degree"),
  ("Connectivity, Paths & Cycles", ["graph-connectivity", "graph-search"], None)],
 "dl/boolean-algebra": [
  ("Functional Completeness", ["functional-completeness"], r"functionally complete"),
  ("Canonical Forms & Implicants", ["canonical-normal-form", "min-sum-of-products-form", "min-products-of-sum-form", "prime-implicants"], r"minterm|maxterm|sum of products|implicant"),
  ("Gate-Level Circuits", ["min-no-gates", "digital-circuits", "circuit-output", "adder"], r"gate|circuit"),
  ("Boolean Identities & Simplification", ["boolean-algebra", "reduction"], None)],
 "dl/k-maps": [
  ("Don't Cares & Prime Implicants", ["prime-implicants"], r"don.?t care|implicant"),
  ("K-Map Minimisation", ["k-map", "min-sum-of-products-form"], None)],
 "dl/combinational-circuits": [
  ("Multiplexers", ["multiplexer"], r"multiplexer|MUX"),
  ("Decoders, Encoders & ROM", ["decoder", "rom"], r"decoder|encoder|ROM"),
  ("Adders & Subtractors", ["adder"], r"adder|subtract|carry"),
  ("Circuit Analysis", ["circuit-output", "combinational-circuit", "digital-circuits"], None)],
 "dl/sequential-circuits": [
  ("Counters", ["digital-counter", "ripple-counter-operation"], r"counter|mod-"),
  ("Shift Registers", ["shift-registers"], r"shift register"),
  ("Flip-Flops", ["flip-flop"], r"flip.?flop|latch"),
  ("FSMs & Sequential Analysis", ["finite-state-machines", "synchronous-asynchronous-circuits", "sequential-circuit", "circuit-output"], None)],
 "dl/number-systems": [
  ("IEEE 754 & Floating Point", ["ieee-representation", "floating-point-representation", "fixed-point-representation"], r"IEEE|floating|mantissa|exponent"),
  ("Signed Numbers & Complements", [], r"complement|signed|overflow"),
  ("Codes", ["binary-codes"], r"gray code|BCD|excess"),
  ("Base Conversion & Representation", ["number-representation", "number-system"], None)],
 "co/machine-instructions-and-addressing-modes": [
  ("Addressing Modes", ["addressing-modes"], r"addressing mode"),
  ("Instruction Formats & Encoding", ["instruction-format"], r"opcode|instruction format|bits for"),
  ("Interrupts", ["interrupts"], r"interrupt"),
  ("Instruction Execution & ISA", ["machine-instruction", "instruction-execution", "instruction-set-architecture"], None)],
 "co/alu-data-path-and-control-unit": [
  ("Microprogrammed Control", ["microprogramming"], r"micro"),
  ("RISC vs CISC", ["cisc-risc-architecture"], r"RISC|CISC"),
  ("Data Path & Control Unit", ["data-path", "control-unit"], None)],
 "co/computer-arithmetic": [
  ("Booth's Algorithm & Multiplication", ["booths-algorithm"], r"booth|multipl"),
  ("Floating Point Arithmetic", ["floating-point-representation", "ieee-representation"], r"floating|IEEE"),
  ("Adders & Carry Lookahead", ["adder", "carry-generator"], r"adder|carry"),
  ("Number Representation", ["number-representation"], None)],
 "co/pipelining": [
  ("Hazards & Stalls", ["data-dependency", "hazards", "data-hazards", "stall"], r"hazard|stall|forwarding|bypass|dependenc"),
  ("Speedup & Throughput", ["speedup", "clock-cycles"], r"speedup|speed-up|throughput"),
  ("Pipeline Timing", ["pipelining"], None)],
 "co/memory-interfacing": [
  ("Multilevel Cache & AMAT", ["multilevel-cache", "average-memory-access-time"], r"average|effective|L2|two.level|hit ratio|hit rate"),
  ("Cache Mapping & Addressing", ["direct-mapping"], r"set.associative|direct.mapped|tag|associativ|lines"),
  ("Memory Chips & Interfacing", ["memory-interfacing", "rom", "dram"], r"chip|DRAM|RAM|ROM|interleav"),
  ("Cache Memory", ["cache-memory"], None)],
 "co/io-interface": [
  ("DMA", ["dma"], r"\bDMA\b"),
  ("Interrupt Handling", ["interrupts"], r"interrupt"),
  ("I/O Organisation", ["io-handling"], None)],
 "co/secondary-memory": [("Disk Storage", ["disk"], None)],
 "pl/basic-of-programming-language": [
  ("Parameter Passing", ["parameter-passing"], r"call by|pass(ed)? by"),
  ("Scope & Binding", ["variable-scope"], r"scop|static|dynamic"),
  ("Macros & Preprocessor", ["macros"], r"#define|macro"),
  ("Loop Invariants & Correctness", ["loop-invariants"], r"invariant"),
  ("Programming Paradigms", ["programming-paradigms"], r"paradigm|object.oriented|functional"),
  ("C Program Output", ["output", "identify-function", "programming-in-c", "programming"], None)],
 "pl/function-and-recursion": [
  ("Parameter Passing", ["parameter-passing"], r"call by|pass(ed)? by"),
  ("Activation Records & Runtime", ["runtime-environment"], r"activation|stack frame"),
  ("Recursion Tracing", ["recursion"], r"recurs"),
  ("Function Output", ["identify-function", "output"], None)],
 "pl/pointer-and-structure-in-c": [
  ("Structures & Unions", ["structure", "union"], r"struct|union"),
  ("Arrays & Strings", ["array", "strings"], r"\[\s*\d*\s*\]|string|char \*"),
  ("Pointers", ["pointers", "aliasing"], None)],
 "ds/arrays": [
  ("Row/Column Major Addressing", [], r"row.major|column.major|address"),
  ("Arrays", ["array"], None)],
 "ds/stacks-and-queues": [
  ("Expression Conversion & Evaluation", ["infix-prefix", "expression-evaluation", "operator-precedence"], r"postfix|prefix|infix"),
  ("Queues & Priority Queues", ["queue", "priority-queue"], r"queue|dequeue|enqueue"),
  ("Stacks", ["stack"], None)],
 "ds/linked-list": [("Linked Lists", ["linked-list"], None)],
 "ds/trees": [
  ("Heaps", ["binary-heap", "priority-queue"], r"heap"),
  ("Binary Search Trees", ["binary-search-tree"], r"binary search tree|BST"),
  ("AVL & B-Trees", ["avl-tree", "b-tree"], r"AVL|B-tree|balanced"),
  ("Binary Trees & Traversals", ["binary-tree", "tree"], None)],
 "ds/hashing": [
  ("Collision Resolution", ["linear-probing", "double-hashing", "uniform-hashing"], r"prob|chaining|collision"),
  ("Hashing", ["hashing"], None)],
 "ds/graphs": [
  ("DFS", ["depth-first-search"], r"depth.first|DFS"),
  ("BFS", ["breadth-first-search"], r"breadth.first|BFS"),
  ("Topological Sort & SCCs", ["topological-sort", "strongly-connected-components"], r"topological|strongly connected"),
  ("Shortest Paths & MST", ["shortest-path", "minimum-spanning-tree"], r"shortest|spanning"),
  ("Graph Representation & Search", ["graph-search", "graph-algorithms"], None)],
 "algo/complexity-analysis-and-asymptotic-notations": [
  ("Recurrence Relations", ["recurrence-relation"], r"T\s*\(\s*n|recurrence"),
  ("Asymptotic Notation", ["asymptotic-notations"], r"\\Theta|\\Omega|O\(|asymptotic|little"),
  ("Time Complexity of Code", ["time-complexity", "identify-function"], None)],
 "algo/searching-and-sorting": [
  ("Heaps & Heap Sort", ["binary-heap", "heap-sort"], r"heap"),
  ("Quick & Merge Sort", ["quick-sort", "merge-sort"], r"quick.?sort|merge.?sort|pivot"),
  ("Searching", ["searching", "bitonic-array"], r"search"),
  ("Comparison Sorting", ["sorting", "selection-sort", "number-of-swap"], None)],
 "algo/divide-and-conquer-method": [
  ("Quick Sort", ["quick-sort"], r"quick.?sort|pivot|partition"),
  ("Merge Sort & Merging", ["merge-sort", "merging"], r"merge"),
  ("Divide & Conquer Recurrences", ["recurrence-relation"], r"T\s*\(\s*n|recurrence"),
  ("Divide & Conquer Design", [], None)],
 "algo/greedy-method": [
  ("Huffman Coding", ["huffman-code"], r"huffman|prefix code"),
  ("Shortest Paths (Dijkstra, Bellman-Ford)", ["shortest-path", "dijkstras-algorithm", "bellman-ford"], r"dijkstra|bellman|shortest"),
  ("Minimum Spanning Trees", ["minimum-spanning-tree", "prims-algorithm"], r"spanning|kruskal|prim"),
  ("Greedy Scheduling & Others", ["greedy-algorithms", "process-scheduling"], None)],
 "algo/dynamic-programming": [
  ("Matrix Chain Multiplication", ["matrix-chain-ordering"], r"matrix.chain|parenthesi"),
  ("LCS & String DP", [], r"subsequence|LCS|edit distance|string"),
  ("Knapsack & Subset Sum", [], r"knapsack|subset.sum"),
  ("All-Pairs Shortest Paths", [], r"floyd|all.pairs|warshall"),
  ("DP Formulation", ["dynamic-programming"], None)],
 "algo/p-and-np-concepts": [("P, NP & Reductions", ["reduction", "decidability"], None)],
 "toc/finite-automata-and-regular-language": [
  ("Minimal DFA & Number of States", ["minimal-state-automata", "number-of-states"], r"minimum number of states|minimal|smallest"),
  ("Regular Expressions", ["regular-expression"], r"regular expression"),
  ("Regular Language Properties", ["regular-language", "identify-class-language", "pumping-lemma", "regular-grammar"], r"regular|closed under|pumping"),
  ("DFA & NFA Design", ["finite-automata", "finite-state-machines"], None)],
 "toc/push-down-automata-and-context-free-language": [
  ("Pushdown Automata", ["pushdown-automata"], r"pushdown|PDA"),
  ("Closure & Decision Properties", ["closure-property", "decidability"], r"closed under|closure|decidable"),
  ("Grammars & Ambiguity", ["grammar", "ambiguous-grammar", "context-free-grammar"], r"grammar|ambiguous|derivation|production"),
  ("Identify the Language Class", ["identify-class-language", "context-free-language"], None)],
 "toc/recursively-enumerable-language-and-turing-machine": [
  ("Turing Machines", ["turing-machine"], r"turing machine|tape"),
  ("Closure Properties", ["closure-property"], r"closed under|closure"),
  ("Decidability", ["decidability"], r"decidable"),
  ("Recursive & RE Languages", ["recursive-and-recursively-enumerable-languages", "identify-class-language"], None)],
 "toc/undecidability": [
  ("Countability", ["countable-uncountable-set"], r"countab"),
  ("Decidability & Rice's Theorem", ["decidability"], None)],
 "cd/lexical-analysis": [
  ("Compilation Phases", ["compilation-phases"], r"phase"),
  ("Lexical Analysis & Tokens", ["lexical-analysis", "compiler-tokenization"], None)],
 "cd/parsing": [
  ("LR Parsing (SLR, LALR, CLR)", ["lr-parser"], r"\bLR|SLR|LALR|CLR|shift.reduce|reduce.reduce|bottom.up"),
  ("LL(1), FIRST & FOLLOW", ["ll-parser", "first-and-follow"], r"LL\s*\(|FIRST|FOLLOW|top.down|predictive|left.recurs"),
  ("Operator Precedence", ["operator-precedence"], r"precedence|associativ"),
  ("Grammars & Ambiguity", ["ambiguous-grammar", "grammar", "context-free-grammar", "parsing"], None)],
 "cd/syntax-directed-translation": [
  ("Intermediate Representations", ["intermediate-code", "three-address-code", "static-single-assignment", "abstract-syntax-tree", "directed-acyclic-graph"], r"three.address|SSA|DAG|syntax tree"),
  ("Attributes & SDT Schemes", ["syntax-directed-translation"], None)],
 "cd/code-generation-and-optimization": [
  ("Register Allocation", ["register-allocation"], r"register"),
  ("Data-Flow & Liveness", ["live-variable-analysis"], r"live|data.flow|reaching"),
  ("Code Optimisation & Basic Blocks", ["code-optimization", "basic-blocks"], r"optimi|basic block|dead code|common subexpression"),
  ("Intermediate Code & SSA", ["intermediate-code", "static-single-assignment", "three-address-code"], r"three.address|SSA"),
  ("Runtime Environment", ["runtime-environment", "parameter-passing"], r"activation|runtime|heap|stack"),
  ("Assemblers & Linkers", ["assembler", "linker"], None)],
 "os/process-concepts-and-cpu-scheduling": [
  ("fork() & Processes", ["fork-system-call", "process"], r"fork"),
  ("Threads", ["threads"], r"thread"),
  ("CPU Scheduling", ["process-scheduling", "srtf", "average-turnaround-time"], r"schedul|round.robin|SJF|SRTF|FCFS|turnaround|waiting time"),
  ("Context Switch, Interrupts & System Calls", ["context-switch", "interrupts", "system-calls", "os-protection"], None)],
 "os/synchronization-and-concurrency": [
  ("Semaphores", ["semaphore"], r"semaphore|P\(|V\(|wait\(|signal\("),
  ("Precedence Graphs & Concurrency", ["precedence-graph"], r"precedence|parbegin|cobegin"),
  ("Critical Section Solutions", ["process-synchronization"], None)],
 "os/deadlocks": [
  ("Banker's Algorithm & Safe State", ["bankers-algorithm"], r"banker|safe"),
  ("Deadlock Prevention, Avoidance & Detection", ["deadlock-prevention-avoidance-detection", "deadlock"], r"prevent|avoid|detect"),
  ("Resource Allocation", ["resource-allocation", "resource-allocation-graph"], None)],
 "os/memory-management": [
  ("Page Replacement", ["page-replacement"], r"LRU|FIFO|optimal|page fault|replacement"),
  ("Paging, Page Tables & TLB", ["translation-lookaside-buffer", "paging", "demand-paging"], r"page table|TLB|page size|level"),
  ("Memory Allocation & Fragmentation", ["memory-management"], r"fragment|best.fit|first.fit|worst.fit|partition"),
  ("Virtual Memory", ["virtual-memory"], None)],
 "os/file-system-io-and-protection": [
  ("Disk Scheduling", ["disk-scheduling"], r"SSTF|SCAN|LOOK|seek|cylinder|head"),
  ("File Systems & Allocation", ["file-system", "bit-vector"], r"inode|file|FAT|block"),
  ("I/O & Interrupts", ["interrupts", "io-handling", "dma"], r"interrupt|DMA|I/O"),
  ("Disk Storage", ["disk"], None)],
 "db/er-diagrams": [("ER Model", ["er-diagram"], None)],
 "db/relational-algebra": [
  ("Relational Calculus", ["relational-calculus", "tuple-relational-calculus"], r"calculus|\\exists|\\forall|∃|∀"),
  ("Joins", ["joins", "natural-join"], r"join|⋈|bowtie"),
  ("Relational Algebra", ["relational-algebra"], None)],
 "db/structured-query-language": [
  ("Nested & Correlated Queries", [], r"EXISTS|IN\s*\(|\bALL\b|\bANY\b|SOME"),
  ("Aggregation & GROUP BY", [], r"GROUP BY|HAVING|COUNT|AVG|SUM|MAX|MIN"),
  ("SQL Queries", ["sql"], None)],
 "db/functional-dependencies-and-normalization": [
  ("Lossless & Dependency-Preserving Decomposition", [], r"lossless|dependency.preserv|decompos"),
  ("Keys, FDs & Closures", ["candidate-key", "super-key", "functional-dependency", "armstrong-axioms"], r"candidate key|super.?key|closure|minimal cover|canonical cover"),
  ("Normal Forms", ["database-normalization"], None)],
 "db/transactions-and-concurrency": [
  ("Serializability", ["conflict-serializable"], r"serializ|precedence graph"),
  ("Locking & Timestamp Protocols", ["two-phase-locking-protocol", "timestamp-ordering"], r"lock|2PL|timestamp"),
  ("Recoverability", [], r"recoverab|cascad|strict"),
  ("Transactions & ACID", ["transaction-and-concurrency"], None)],
 "db/file-structures-and-indexing": [
  ("B & B+ Trees", ["b-tree"], r"B\+|B-tree|B tree|order of|fan.?out"),
  ("Indexing & File Organisation", ["indexing", "file-system"], None)],
 "cn/concepts-of-layering": [("OSI & TCP/IP Layering", ["osi-model"], None)],
 "cn/data-link-layer-and-switching": [
  ("Sliding Window & Flow Control", ["sliding-window", "stop-and-wait"], r"window|go.back|selective repeat|stop.and.wait|efficiency"),
  ("Error Detection & Correction", ["error-detection", "crc-polynomial", "hamming-code"], r"CRC|parity|hamming|checksum|error"),
  ("Framing & Bit Stuffing", ["bit-stuffing"], r"stuff|framing|flag"),
  ("Switching", ["network-switching"], None)],
 "cn/lan-technologies-and-wi-fi": [
  ("ALOHA & MAC Protocols", ["slotted-aloha", "mac-protocol"], r"aloha"),
  ("Ethernet & CSMA/CD", ["ethernet", "csma-cd"], r"ethernet|CSMA|collision"),
  ("Bridges & Token Ring", ["bridges"], r"bridge|token"),
  ("LAN Technologies", ["lan-technologies"], None)],
 "cn/network-layer": [
  ("IP Fragmentation", ["fragmentation"], r"fragment|MTU"),
  ("Subnetting & CIDR", ["subnetting", "ip-addressing"], r"subnet|CIDR|netmask|mask|/\d\d"),
  ("IP Header & Packets", ["ip-packet"], r"header|TTL|datagram"),
  ("Network Layer Protocols", ["routing", "network-protocols"], None)],
 "cn/routing-algorithm": [
  ("Distance Vector Routing", ["distance-vector-routing"], r"distance.vector|count.to.infinity|RIP"),
  ("Link State Routing", [], r"link.state|OSPF"),
  ("Routing", ["routing"], None)],
 "cn/tcp-udp-sockets-and-congestion-control": [
  ("Congestion Control", ["congestion-control", "token-bucket"], r"congestion|slow start|threshold|token bucket|leaky"),
  ("UDP & Sockets", ["udp", "sockets"], r"UDP|socket"),
  ("TCP", ["tcp", "wrap-around-time"], None)],
 "cn/application-layer-protocol": [("Application Layer Protocols", ["application-layer-protocols"], None)],
 "cn/network-security": [("Cryptography & Security", [], None)],
 "se/software-engineering": [("Software Engineering", [], None)],
 "web/web-technologies": [("Web Technologies", [], None)],
}

# GATE CSE papers are typically ~30% easy, ~50% moderate, ~20% difficult
# (coaching-institute paper analyses, e.g. 2020: 30/50/20, 2021: 25/55/20).
DIFFICULTY_MIX = (0.30, 0.50, 0.20)

def add_difficulty(qs, mix=DIFFICULTY_MIX):
    """Estimated difficulty q['d'] in {'e','m','h'}.

    The bank has no difficulty labels, so we rank questions inside each
    (subject, marks) group by a score built from the question type (NAT/MSQ are
    harder than MCQ), the length of the worked solution (longer = more steps),
    and options count, then cut the ranking at the GATE mix percentiles.
    """
    import math, statistics
    groups = collections.defaultdict(list)
    for q in qs:
        groups[(q["s"], 2 if (q.get("m") or 1) >= 2 else 1)].append(q)
    for arr in groups.values():
        lens = [math.log1p(len(re.sub(r"\$[^$]*\$", "x", q.get("e", "")))) for q in arr]
        mu = statistics.mean(lens); sd = statistics.pstdev(lens) or 1.0
        scored = []
        for q, l in zip(arr, lens):
            sc = (l - mu) / sd
            sc += 0.6 if q["t"] == "NAT" else 0.7 if q["t"] == "MSQ" else 0.0
            sc += 0.3 if q.get("note") else 0.0          # disputed / tricky wording
            scored.append((sc, q["id"], q))
        scored.sort(key=lambda x: (x[0], x[1]))
        n = len(scored)
        for i, (_, _, q) in enumerate(scored):
            p = i / n
            q["d"] = "e" if p < mix[0] else "m" if p < mix[0] + mix[1] else "h"

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

TAG_RE = re.compile(r"<[^>]+>")

def main():
    d = json.loads(SRC.read_text(encoding="utf-8"))
    qs = d["questions"]
    by_chapter = collections.defaultdict(list)
    for q in qs:
        by_chapter[f'{q["s"]}/{q["c"]}'].append(q)

    subjects = []
    missing = []
    for s in d["subjects"]:
        chapters = []
        for c in s["chapters"]:
            key = f'{s["id"]}/{c["id"]}'
            rules = T.get(key)
            if rules is None:
                missing.append(key)
                rules = []
            topics = [{"id": slug(n), "name": n, "q": []} for n, _, _ in rules]
            mixed = {"id": "mixed", "name": "Mixed Problems", "q": []}
            for q in by_chapter.get(key, []):
                tags = set(q.get("tags", []))
                text = TAG_RE.sub(" ", q["q"]) + " " + " ".join(q.get("o", []) or [])
                hit = None
                for i, (_, tg, kw) in enumerate(rules):
                    if tags & set(tg):
                        hit = i; break
                if hit is None:
                    for i, (_, tg, kw) in enumerate(rules):
                        if kw and re.search(kw, text, re.I):
                            hit = i; break
                if hit is None and rules and rules[-1][2] is None:
                    hit = len(rules) - 1          # catch-all last topic
                (topics[hit] if hit is not None else mixed)["q"].append(q["id"])
                q["tp"] = topics[hit]["id"] if hit is not None else "mixed"
            if mixed["q"]:
                topics.append(mixed)
            topics = [t for t in topics if t["q"]]
            for t in topics:  # newest papers first inside a topic
                order = {q["id"]: (-q["y"], q.get("set") or 0, q.get("n", "")) for q in by_chapter[key]}
                t["q"].sort(key=lambda i: order[i])
            chapters.append({"id": c["id"], "name": c["name"], "topics": topics,
                             "count": sum(len(t["q"]) for t in topics)})
        subjects.append({"id": s["id"], "name": s["name"], "short": s.get("short", s["name"]),
                         "chapters": chapters, "count": sum(c["count"] for c in chapters)})

    add_difficulty(qs)
    out = {"meta": d["meta"], "subjects": subjects, "papers": d["papers"], "questions": qs}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # report
    total_topics = sum(len(c["topics"]) for s in subjects for c in s["chapters"])
    mixed_n = sum(len(t["q"]) for s in subjects for c in s["chapters"] for t in c["topics"] if t["id"] == "mixed")
    print(f"questions={len(qs)} subjects={len(subjects)} topics={total_topics} mixed={mixed_n} missing_maps={missing}")
    for s in subjects:
        for c in s["chapters"]:
            print(f'  {s["id"]}/{c["id"]}: ' + ", ".join(f'{t["name"]}({len(t["q"])})' for t in c["topics"]))

if __name__ == "__main__":
    main()
