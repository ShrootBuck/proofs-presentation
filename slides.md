---
theme: default
title: Prove It
favicon: /favicon.svg
titleTemplate: '%s'
author: Zayd Krunz
info: |
  A 30-minute introduction to mathematical proof, with live logic experiments and a classroom game.
  Capstone Differential Equations · BASIS Tucson North
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 1200
fonts:
  provider: none
  sans: Inter Variable
  mono: IBM Plex Mono
defaults:
  layout: default
  transition: lift
transition: wipe
class: dark title-slide
hideFooter: true
duration: 30min
timer: stopwatch
presenter: true
drawings:
  enabled: true
  persist: false
  presenterOnly: false
  syncAll: true
record: false
download: false
exportFilename: prove-it
mdc: false
lineNumbers: false
selectable: true
routerMode: hash
time: '0:00–0:25'
---

<div class="title-lockup">
  <h1 v-motion :initial="{ y: 30, opacity: 0 }" :enter="{ y: 0, opacity: 1, transition: { duration: 700 } }">PROVE <span class="title-second">IT.</span></h1>
  <div class="title-subtitle" v-motion :initial="{ y: 15, opacity: 0 }" :enter="{ y: 0, opacity: 1, transition: { delay: 200, duration: 650 } }">The art of being certain</div>
</div>
<div class="title-qed" aria-label="End of proof">∎</div>
<div class="title-credits">
  <div class="title-author">Zayd Krunz</div>
  <div class="title-course">Capstone: Differential Equations</div>
</div>

<!--
Today we're talking about proofs. This is technically happening in our differential equations class, but you can put those away for half an hour.

The question is simple: when does a mathematical claim actually deserve our trust? We'll try to break a pattern, learn a few proof techniques, and play some games about catching bad arguments.
-->

---
section: BREAK THE PATTERN
time: '0:25–3:00'
---

# Break the pattern.

<ActivityLauncher kind="hunt" />

<!--
On a computer, open the link. On a phone, you can scan the picture instead. Yes, the picture is the QR code. Enter the room code on screen and your name. Keep the activity page open; we'll use it again later.

Here's the claim we're testing: for every nonnegative integer n, A and B have no common factor greater than one. A is n to the seventeenth plus nine. B is n plus one, all to the seventeenth, plus nine. Your job is to disprove the claim by finding just one input where they do share a factor greater than one.

For example, twelve and twenty-five have no shared factor above one. Twelve and eighteen share six. The app checks that for you. GCD means greatest common divisor: a result of one means no shared factor above one.

You have exactly one minute. Try small numbers, big numbers, whatever you like. You can enter up to a hundred digits. Ready?

This is running on a laptop server under my bed with less than eight gigs of RAM. If one of your inputs crashes the server, I'll buy you a Wingstop chicken sandwich. Your name and input get logged before the calculation, so I can recover the winning guess. Good luck.

Lots of tests. Still no shared factor. Is that a proof that there's never one?
-->

---
section: COUNTEREXAMPLE
clicks: 2
time: '3:00–3:50'
---

# Fifty-two digits later.

<div class="micro">THE FIRST NONNEGATIVE COUNTEREXAMPLE</div>
<div class="reveal-big">8424432925592889329288197322308900672459420460792433</div>
<div v-click="1" class="aside">At this input, both numbers are divisible by<br /><span class="factor-integer">8936582237915716659950962253358945635793453256935559</span></div>
<div v-click="2" class="takeaway">A long streak of successes is not a universal proof.</div>

<!--
Every smaller nonnegative integer passes this test. The first counterexample is this fifty-two-digit number.

[click] At this input, both results share the factor shown here. The app uses exact integer arithmetic, so this is not a rounding error. We can divide both numbers by that factor with zero remainder.

[click] Our claim was that A and B never share a factor greater than one, for any nonnegative integer n. This one input proves that claim false. That's disproof by counterexample: one exception is enough to defeat an all-inputs claim.
-->

---
section: COLLATZ
clicks: 5
---

# The Collatz conjecture.

<p class="lead">Start with any <strong>positive integer</strong>. Repeat:</p>

<div v-click="1" style="display:flex;gap:80px;margin:20px 0;font-size:30px">
  <div>Even? <MathTex tex="n\mapsto n/2" /></div>
  <div>Odd? <MathTex tex="n\mapsto 3n+1" /></div>
</div>

<div v-click="2" style="font-size:26px;margin:20px 0"><MathTex tex="6\to3\to10\to5\to16\to8\to4\to2\to1" /></div>

<p v-click="3" class="lead">The conjecture: every starting value eventually reaches 1.</p>

<CollatzCounter v-click="4" />

<div v-click="5" class="takeaway" style="margin-top:20px;font-size:22px">More verified cases. Still not a proof for all integers.</div>

<!--
Here's a famous example: the Collatz conjecture. Pick any positive whole number.

[click] If it's even, divide it by two. If it's odd, multiply it by three and add one. Then repeat.

[click] Starting at six, we get three, ten, five, sixteen, eight, four, two, one.

[click] The conjecture says every positive starting number eventually reaches one.

[click] This counter is real. Since this presentation loaded, a background worker has been checking starting values in order using exact integer arithmetic. Every positive integer up to that number has been verified. If a sequence reaches a smaller starting value we've already verified, we know the rest of its journey reaches one too. The counter only advances after that check succeeds.

[click] But no matter how high it gets, there are infinitely many numbers left. A later sequence could, in principle, grow forever or enter a different cycle. More examples don't rule that out. That's the gap a proof has to close.
-->

---
section: WHAT A PROOF DOES
clicks: 3
time: '3:50–4:30'
---


# What counts as a proof?

<p class="lead">An argument that forces a conclusion from stated assumptions.</p>

<div class="contract-chain">
  <div><span class="micro">START WITH</span><h3>Assumptions<br />& definitions</h3></div>
  <span class="flow-arrow" v-click="1">⇒</span>
  <div v-click="1"><span class="micro">JUSTIFY</span><h3>Every<br />inference</h3></div>
  <span class="flow-arrow" v-click="2">⇒</span>
  <div v-click="2"><span class="micro">REACH</span><h3>The exact<br />claim</h3></div>
</div>

<p v-click="3" class="aside">The argument must cover every case the claim promises.</p>

<!--

A proof starts with assumptions, definitions, and results we've already established. It then gives a chain of reasoning that forces the conclusion.

[click] Every step needs a reason. It might use a definition, a valid algebraic operation, or a theorem. Looking plausible is not a reason.

[click] And the conclusion has to be the exact claim we promised. Proving something similar, or only part of it, doesn't finish the job.

[click] The argument must cover every case the claim promises. If we say every integer, checking only the positive ones leaves a hole.

We'll write readable mathematical proofs, rather than translate every sentence into a formal symbolic system. But the logic underneath is the same. Someone should be able to challenge any step and get a real answer.

You can actually make a computer check this. In a proof assistant like Lean, you formalize the statement and its proof, and the system checks that the conclusion follows from the definitions and assumptions. It's checking the reasoning, not just trying a bunch of inputs.

Before we build those arguments, let's get a little more precise about what statements mean.
-->

---
section: LOGIC
clicks: 3
time: '4:30–5:15'
---

# A tiny logic toolkit

<p class="small">A proposition is a statement with a truth value: true or false.</p>

<div class="logic-grid">
  <div class="symbols"><div class="symbol"><MathTex tex="\neg P" /></div><div class="meaning">NOT P</div><div class="example">Reverses the truth value of P.</div></div>
  <div v-click="1" class="symbols"><div class="symbol"><MathTex tex="P\land Q" /></div><div class="meaning">P AND Q</div><div class="example">True only when both are true.</div></div>
  <div v-click="2" class="symbols"><div class="symbol"><MathTex tex="P\lor Q" /></div><div class="meaning">P OR Q</div><div class="example">True when at least one is true.</div></div>
  <div v-click="3" class="symbols"><div class="symbol"><MathTex tex="P\Rightarrow Q" /></div><div class="meaning">IF P, THEN Q</div><div class="example">P guarantees Q.</div></div>
</div>

<p v-click="2" class="logic-note muted">In mathematics, OR includes the possibility that both are true.</p>

<!--
A proposition is a statement that is true or false. "Seven is prime" is a proposition.

We'll call statements P and Q. Not P reverses the truth value.

[click] P and Q requires both statements to be true.

[click] P or Q requires at least one. Mathematical or is inclusive, so both being true is allowed.

[click] Finally, if P then Q says P guarantees Q. This is the shape of a huge number of theorems, and it has one slightly weird feature worth unpacking.
-->

---
section: LOGIC
time: '5:15–6:25'
---

# When is a promise broken?

<ImplicationLab />

<!--
[DO: Set both buttons to TRUE before starting. Click a button only if it currently says FALSE.]

Suppose I say, if you guess my magic number, I'll buy you Wingstop. P means you guessed my magic number, and Q means you got Wingstop. Which situation breaks my promise?

[DO: Click Q, "Got Wingstop", to change it to FALSE. Leave P TRUE. Ask the room whether the promise is broken before explaining.]

You guessed my magic number, but no Wingstop. That's the one forbidden situation: P is true and Q is false.

[DO: Click P, "Guessed my magic number", to change it to FALSE. Leave Q FALSE.]

Now you didn't guess it, and there's no Wingstop. Disappointing, maybe, but the promise never said what happens if you don't guess the number.

[DO: Click Q, "Got Wingstop", to change it back to TRUE. Leave P FALSE.]

And if you didn't guess it but got Wingstop anyway, the promise still holds. I can buy Wingstop for other reasons. That's why the bottom two rows are true.

This is the truth table for material implication. It describes a logical condition, not necessarily a cause. To disprove an if-then claim, you need a case where the hypothesis holds and the conclusion fails. That's the exact kind of failure we're hunting.
-->

---
section: LOGIC
clicks: 3
time: '6:25–7:15'
---


# The converse trap

<div class="compare-row"><div class="label">ORIGINAL</div><div class="formula"><MathTex tex="P\Rightarrow Q" /></div><div class="description">Divisible by 4 implies even.</div></div>
<div v-click="1" class="compare-row bad"><div class="label">CONVERSE</div><div class="formula"><MathTex tex="Q\Rightarrow P" /></div><div class="description">Even implies divisible by 4?<br /><strong>6 breaks it.</strong></div></div>
<div v-click="2" class="compare-row good"><div class="label">CONTRAPOSITIVE</div><div class="formula"><MathTex tex="\neg Q\Rightarrow\neg P" /></div><div class="description">Not even implies not divisible by 4.<br /><strong>Equivalent to the original.</strong></div></div>

<p v-click="3" class="takeaway">Reversing an implication needs its own proof.</p>

<!--

Here's a true implication over the integers: if a number is divisible by four, it's even.

[click] Reverse that and we get: if a number is even, it's divisible by four. That's the converse, and six destroys it. The original implication did not give us permission to run the arrow backward.

[click] But there is a way to turn it around safely. Reverse the arrow and negate both statements. If a number is not even, then it is not divisible by four. That's the contrapositive, and it is logically equivalent to the original.

Both rule out exactly the same bad case: divisible by four but not even. We'll use this equivalence as an actual proof technique in a few minutes.

[click] Reversing an implication needs its own proof. If a theorem says if and only if, it promises both directions. Both need justification.
-->

---
section: LOGIC
clicks: 2
time: '7:15–8:00'
---


# Every versus at least one

<div class="split" style="margin-top: 45px">
  <div class="quantifier"><div class="glyph">∀</div><div><div class="word">For every</div><div class="math-big"><MathTex tex="\forall n\in\mathbb{Z},\quad n^2\geq0" /></div><p>Every integer has a nonnegative square.</p><p class="muted">One failing integer would disprove it.</p></div></div>
  <div v-click="1" class="quantifier"><div class="glyph">∃</div><div><div class="word">There exists</div><div class="math-big"><MathTex tex="\exists n\in\mathbb{Z},\quad n^2=9" /></div><p>Some integer has square 9.</p><p class="muted">One witness, such as 3, proves it.</p></div></div>
</div>

<p v-click="2" class="aside" style="margin-top: 35px">The domain matters: <MathTex tex="x^2=2" /> has a real solution, but no integer solution.</p>

<!--

These two symbols tell us how much work a claim requires. The upside-down A means for every. For every integer n, n squared is nonnegative. A universal statement ranges over its entire domain.

[click] The backward E means there exists. There exists an integer whose square is nine. Here I can give you three, check that three squared is nine, and I'm done. That example is called a witness.

Notice how one example has completely different power depending on the quantifier. A successful example proves an existence claim. A failing example disproves a universal claim.

[click] Also, say what the domain is. The equation x squared equals two has a real solution. It has no integer solution. Changing the allowed objects changes the statement, even when the equation looks identical.
-->

---
class: blue
section: LOGIC
transition: wipe
clicks: 1
time: '8:00–8:40'
---


# What's the negation?

<div class="statement">"Every student solved the puzzle."</div>

<div class="negation-options">
  <div class="negation-option"><div class="option-letter">A</div>No student solved the puzzle.</div>
  <div class="negation-option"><div class="option-letter">B</div>At least one student did not solve the puzzle.</div>
</div>

<div v-click="1" class="negation-answer"><strong>B. "Not every" means "at least one didn't."</strong><div style="margin-top: 15px; font-size: 24px">20 students solved it. 1 didn't. So "every student solved it" is false.</div><div style="margin-top: 12px; font-size: 24px">One exception is enough. It doesn't mean nobody solved it.</div></div>

<!--

Quick vote. The statement is: every student solved the puzzle. Is its negation A, no student solved it, or B, at least one student did not solve it?

[PAUSE: Ask for hands for A and B.]

[click] It's B. To make every student solved it false, we only need one student who didn't. A is much stronger than necessary. Imagine twenty people solved it and one didn't. The original claim is false, but A is also false.

So "not every" means "at least one didn't." It doesn't mean "none." In symbols, negating "for every" gives "there exists," and we negate the statement inside. We'll use this when a proof by contradiction starts by assuming our claim is false.
-->

---
class: dark methods-overview
section: METHODS
transition: wipe
clicks: 1
time: '8:40–9:10'
---


# How do we force a conclusion?

<div class="method-overview-grid">
  <div><span>01</span><h2>Direct proof</h2><p>Follow the assumptions forward.</p></div>
  <div><span>02</span><h2>Proof by cases</h2><p>These suck.</p></div>
  <div><span>03</span><h2>Contrapositive</h2><p>Prove “not Q implies not P.”</p></div>
  <div><span>04</span><h2>Contradiction</h2><p>Assume the claim is false. Find a conflict.</p></div>
  <div><span>05</span><h2>Induction</h2><p>Start the chain. Prove the next link.</p></div>
  <div><span>06</span><h2>Construction</h2><p>Build an example that works.</p></div>
</div>

<p v-click="1" class="methods-reminder">Before proving it, try to break it. One counterexample is enough.</p>

<!--

Now we have enough language to build proofs. These are six useful approaches, and we'll actually use each one.

Direct proof follows the assumptions forward. Cases split the possibilities. Contrapositive changes the direction safely. Contradiction asks what would happen if the target were false. Induction builds an infinite chain. Construction gives us an object that works.

[click] But before any of those, check whether the claim is true. Try a few small values, zero when it's allowed, and negative numbers when they're allowed. Testing can guide a proof, and a counterexample can end a doomed proof attempt very quickly.
-->

---
section: DIRECT PROOF
clicks: 4
time: '9:10–10:15'
---

<div class="proof-method-label">01 / Direct proof</div>

# Odd + odd = even

<p class="small">Let <MathTex tex="a,b" /> be arbitrary odd integers.</p>

<div class="proof-rows">
  <div v-click="1" class="proof-row"><span class="line-number">01</span><div class="math"><MathTex tex="a=2r+1,\qquad b=2s+1" /></div><div class="reason">Definition of odd<br /><MathTex tex="r,s\in\mathbb{Z}" /></div></div>
  <div v-click="2" class="proof-row"><span class="line-number">02</span><div class="math"><MathTex tex="a+b=2r+2s+2" /></div><div class="reason">Substitute and combine</div></div>
  <div v-click="3" class="proof-row final"><span class="line-number">03</span><div class="math"><MathTex tex="a+b=2(r+s+1)" /><span class="proof-qed" aria-label="QED"></span></div><div class="reason">Twice an integer is even</div></div>
</div>

<p v-click="4" class="takeaway direct-proof-takeaway"><span>Arbitrary inputs make the argument general.</span></p>

<!--
Let's prove that the sum of two odd integers is even. We choose arbitrary odd integers a and b. Arbitrary means we're not selecting special values that make the argument easy.

[click] The definition of odd tells us that a equals two r plus one and b equals two s plus one, where r and s are integers.

Why different letters? Because the two odd numbers don't have to be equal. Writing both as two r plus one would quietly restrict our claim.

[click] Add them and combine the terms. We get two r plus two s plus two.

[click] Factor out two. The result is twice r plus s plus one. The quantity inside the parentheses is an integer, so this is even by definition.

That last sentence is the actual finish. We haven't just simplified an expression. We've connected it to the definition of the thing we promised to prove.

[click] Nothing depended on a particular choice of a or b, so the proof covers every pair of odd integers, including negative ones.

Buh buh but zayd... What's that black square?
-->

---
class: dark qed-slide
clicks: 0
---

# The mic drop operator

<div class="qed-explainer">
  <div class="qed-symbol">∎</div>
  <div><h2>Proof complete.</h2><p>The square marks the end of a proof.</p><p><strong>Q.E.D.</strong> — <em>quod erat demonstrandum</em></p><p>“Which was to be demonstrated.”</p></div>
</div>
<p class="takeaway">You earn the square by finishing the argument.</p>

<!--
That proof is finished, so now we get to use the mathematical mic drop: this little square. You'll see it at the end of proofs, sometimes as an outline instead of a filled square.

You might also see Q.E.D. That's short for the Latin quod erat demonstrandum, meaning which was to be demonstrated. Basically: we proved what we said we would.
-->

---
section: PROOF BY CASES
clicks: 3
time: '10:15–11:00'
---


<div class="proof-method-label">02 / Proof by cases</div>

# One of the neighbors is even

<div class="statement"><MathTex tex="n(n+1)\text{ is even for every }n\in\mathbb{Z}." /></div>

<div class="cases">
  <div v-click="1" class="case"><div class="case-label">CASE 1</div><h3>n is even</h3><div class="math-big"><MathTex tex="n(n+1)=2k(n+1)" /></div><p>A factor of 2 makes the product even.</p></div>
  <div v-click="2" class="case"><div class="case-label">CASE 2</div><h3>n is odd</h3><div class="math-big"><MathTex tex="n+1=2(k+1)" /></div><p>Its neighbor is even, so the product is even.</p></div>
</div>

<p v-click="3" class="takeaway">Every integer is even or odd. The cases cover the domain.<span class="proof-qed" aria-label="QED"></span></p>

<!--

Now let's prove that n times n plus one is even for every integer n. These are two consecutive integers.

[click] Case one: n is even. Then n is two k for some integer k. Our product is two times an integer, so it's even.

[click] Case two: n is odd. Then n is two k plus one, which makes n plus one equal to two k plus two. This time the second factor is even, and the product is still even.

[click] The essential sentence is that every integer is either even or odd. We've covered the whole domain. A proof by cases needs every possible case to be covered. They can overlap, but they can't leave a gap.

Checking only positive and negative integers, for example, would miss zero. Tiny omissions are how large claims escape.
-->

---
section: CONTRAPOSITIVE
clicks: 4
time: '11:00–12:10'
---


<div class="proof-method-label">03 / Contrapositive</div>

# An even square has an even root

<p class="small">For an integer <MathTex tex="n" />: <MathTex tex="n^2\text{ even}\ \Rightarrow\ n\text{ even}" /></p>

<div v-click="1" class="ink-box" style="margin-top: 24px"><span class="micro">EQUIVALENT TARGET</span><div style="font-size: 31px; margin-top: 8px"><MathTex tex="n\text{ odd}\ \Rightarrow\ n^2\text{ odd}" /></div></div>

<div class="proof-rows">
  <div v-click="2" class="proof-row"><span class="line-number">01</span><div class="math"><MathTex tex="n=2k+1\quad(k\in\mathbb{Z})" /></div><div class="reason">Assume n is odd</div></div>
  <div v-click="3" class="proof-row final"><span class="line-number">02</span><div class="math"><MathTex tex="n^2=4k^2+4k+1=2(2k^2+2k)+1" /></div><div class="reason">An odd integer</div></div>
</div>

<p v-click="4" class="takeaway direct-proof-takeaway">Therefore, if <MathTex tex="n^2" /> is even, <MathTex tex="n" /> must be even.<span class="proof-qed" aria-label="QED"></span></p>

<!--

Our next claim is that if an integer's square is even, the integer itself is even. We need a justification. Saying it's obvious because even times even is even would run the implication in the wrong direction.

[click] Instead, use the contrapositive. If n is not even, its square is not even. For integers, that's the same as saying if n is odd, n squared is odd.

[click] Suppose n is odd. Then n is two k plus one for an integer k.

[click] Square it. We get four k squared plus four k plus one. Rewrite that as two times the integer two k squared plus two k, then plus one. That's odd.

[click] We've proved the contrapositive, so we've proved the original implication. An odd integer can't have an even square. Therefore an integer with an even square must be even.

Keep this result. In a moment we'll use it twice inside a different proof. This is how mathematical arguments build on each other instead of starting over every time.
-->

---
class: dark
section: CONTRADICTION
transition: wipe
clicks: 3
time: '12:10–12:45'
---


<div class="proof-method-label">04 / Contradiction</div>

# Suppose the target is false

<div class="contradiction-chain">
  <div class="chunk"><MathTex tex="\neg P" /><p>Assume the negation<br />of the target.</p></div>
  <div v-click="1" class="arrow">⇒</div>
  <div v-click="1" class="chunk"><MathTex tex="R\land\neg R" /><p>Derive something<br />impossible.</p></div>
  <div v-click="2" class="arrow">⇒</div>
  <div v-click="2" class="chunk"><MathTex tex="P" /><p>Reject the negation.<br />The target holds.</p></div>
</div>

<p v-click="3" class="aside" style="margin-top: 43px">The contradiction must be a logical impossibility, not just a surprising result.</p>

<!--

Proof by contradiction starts by assuming the exact opposite of what we want to prove.

[click] We then follow valid steps until that assumption forces an impossibility. For example, a quantity might have to be both even and odd, or a fraction might have to be both in lowest terms and reducible.

[click] That means the extra assumption cannot hold, so the original target does hold, under our standing assumptions.

[click] This differs from contrapositive. Contrapositive directly proves an equivalent implication. Contradiction assumes a negation and drives it into a wall. The wall has to be a real contradiction. I don't like this result is not a proof technique.
-->

---
section: CONTRADICTION
clicks: 2
time: '12:45–13:45'
---


<div class="proof-method-label">04 / Contradiction</div>

# A fraction in lowest terms

<div class="sqrt-setup">
  <div><div class="micro">ASSUME THE OPPOSITE</div><div class="giant-root"><MathTex tex="\sqrt{2}=\frac{a}{b}" /></div><p class="small"><MathTex tex="a,b" /> are positive integers.<br />Choose the fraction in lowest terms.</p></div>
  <div>
    <div v-click="1" class="aside">Rational means expressible as a ratio of integers.</div>
    <div v-click="2" class="reduced-example"><MathTex tex="\frac{6}{4}=\frac{3}{2}" /><p class="small muted" style="margin-top: 15px">In lowest terms, a and b share no common factor greater than 1.</p></div>
  </div>
</div>

<!--

Let's prove that the square root of two is irrational. Assume the opposite: it equals a over b, with a and b both positive integers. We choose that fraction in lowest terms.

[click] Rational means expressible as a ratio of integers. Irrational means no such ratio exists. A long decimal display can't settle this. A rational number can also have an infinite decimal expansion, like one third. So we need an argument about all possible fractions.

[click] Lowest terms means a and b share no integer factor greater than one. We can always reduce a rational fraction, just as six over four reduces to three over two.

That condition is going to matter. We'll show that our supposedly reduced numerator and denominator must both be even. Then two would divide both of them, directly contradicting the way we chose the fraction.

Remember the result we just proved: an even square has an even integer root.
-->

---
section: CONTRADICTION
clicks: 5
time: '13:45–15:00'
---


<div class="proof-method-label">04 / Contradiction</div>

# The fraction reduces after all

<div class="proof-rows">
  <div v-click="1" class="proof-row"><span class="line-number">01</span><div class="math"><MathTex tex="2=\frac{a^2}{b^2}\quad\Rightarrow\quad a^2=2b^2" /></div><div class="reason">Square both sides<br />a² is even, so a is even</div></div>
  <div v-click="2" class="proof-row"><span class="line-number">02</span><div class="math"><MathTex tex="a=2k\quad\Rightarrow\quad 4k^2=2b^2" /></div><div class="reason">Substitute a = 2k</div></div>
  <div v-click="3" class="proof-row"><span class="line-number">03</span><div class="math"><MathTex tex="b^2=2k^2\quad\Rightarrow\quad b\text{ is even}" /></div><div class="reason">Use the same lemma again</div></div>
</div>

<div v-click="4" class="contradiction-callout"><span>Lowest terms</span><span class="conflict">CONTRADICTS</span><span>Both divisible by 2</span></div>
<p v-click="5" class="takeaway direct-proof-takeaway">No such fraction exists. <MathTex tex="\sqrt{2}" /> is irrational.<span class="proof-qed" aria-label="QED"></span></p>

<!--

Start with square root of two equals a over b.

[click] Square both sides and multiply by b squared. We get a squared equals two b squared. So a squared is even. Our earlier lemma tells us a itself is even.

[click] Write a as two k. Substitution gives four k squared equals two b squared.

[click] Divide by two, and b squared equals two k squared. That makes b squared even, so the same lemma tells us b is even too.

Before I reveal the finish, what have we just shown about the fraction?

[PAUSE for a response.]

[click] Both numerator and denominator have a factor of two. But we chose a fraction with no common factor greater than one. Those conditions cannot both hold.

[click] So the assumption that square root of two is rational fails. There is no integer fraction representing it.

Notice how precise the contradiction is. We didn't say the fraction looks unlikely. We found two incompatible facts about the very same fraction.
-->

---
class: dark
section: INDUCTION
transition: wipe
clicks: 3
time: '15:00–16:20'
---


<div class="proof-method-label">05 / Induction</div>

# Induction: prove the start and the step

<p class="small"><MathTex tex="P(n)" /> means “the claim is true for n.” Our goal: every positive integer.</p>

<div class="induction-obligations">
  <div v-click="1" class="induction-obligation">
    <h2>1. Establish a fact</h2>
    <div class="induction-core"><MathTex tex="P(1)" /></div>
    <p>Prove the first case directly.</p>
    <div class="induction-caption">BASE CASE</div>
  </div>
  <div v-click="2" class="induction-obligation">
    <h2>2. Prove a reusable rule</h2>
    <div class="induction-core"><MathTex tex="P(k)\Rightarrow P(k+1)" /></div>
    <p>For any integer k ≥ 1: assume this case.<br />Deduce the next one.</p>
    <div class="induction-caption">INDUCTIVE STEP</div>
  </div>
</div>

<div v-click="3" class="induction-reach">
  <div class="induction-route"><span class="induction-start"><MathTex tex="P(1)" /></span><span>→</span><MathTex tex="P(2)" /><span>→</span><MathTex tex="P(3)" /><span>→ ⋯ →</span><span class="induction-target"><MathTex tex="P(N)" /></span></div>
  <p>Choose any N. The same rule reaches it in N − 1 steps.</p>
</div>


<!--
Induction is a way to prove a claim for every positive integer without checking them one at a time. P of n is just shorthand for the claim at the number n. There are two things we need to prove.

[click] First, the base case. Prove P of one directly. That gives us one established fact, but it says nothing yet about two, three, or any other number.

[click] Second, the inductive step. Pick an arbitrary integer k at least one. Temporarily assume P of k, and use that assumption to prove P of k plus one. We're proving an if-then statement that works for any k. We're not assuming the whole theorem, and we're not allowed to assume P of k plus one.

[click] Now combine them. P of one is established. Apply the step with k equal to one, and we get P of two. Apply it with k equal to two, and we get P of three. Pick any positive integer N. Repeating the same justified step N minus one times reaches P of N. N can be a trillion; it is still a finite number of steps. We don't actually have to perform those steps to know the argument reaches it.


-->

---
section: INDUCTION
time: '16:20–17:05'
---


<div class="proof-method-label">05 / Induction</div>

# One new layer at a time

<p class="small"><MathTex tex="1+3+5+\cdots+(2n-1)=n^2" /></p>

<OddSquare />

<!--

Here's the claim we'll prove by induction: the first n positive odd integers add up to n squared.

One square, then three more, gives a two-by-two square. Add five, and it's three-by-three.

[DO: Start at n = 3. Click Add a layer twice.]

Each new L-shaped border turns a square into the next larger square. To grow a k-by-k square to a k-plus-one-by-k-plus-one square, the border contains k squares along one side, k along the other, plus the corner. That's two k plus one.

The diagram makes the next odd number feel inevitable. But showing a few sizes is still only showing a few sizes. We can turn the general border argument into a proof, or write the same idea algebraically using induction. Let's do that.
-->

---
section: INDUCTION
class: induction-proof
clicks: 4
time: '17:05–18:15'
---


<div class="proof-method-label">05 / Induction</div>

# The pattern holds for every n ≥ 1

<div class="induction-equation"><MathTex tex="P(n):\quad 1+3+\cdots+(2n-1)=n^2" /></div>

<div class="proof-rows">
  <div v-click="1" class="proof-row"><span class="line-number">BASE</span><div class="math"><MathTex tex="n=1:\qquad 1=1^2" /></div><div class="reason">The first case holds</div></div>
  <div v-click="2" class="proof-row"><span class="line-number">ASSUME</span><div class="math"><MathTex tex="1+3+\cdots+(2k-1)=k^2" /></div><div class="reason" style="white-space:nowrap;font-size:16px">For an arbitrary integer k ≥ 1</div></div>
  <div v-click="3" class="proof-row final"><span class="line-number">STEP</span><div class="math"><MathTex tex="k^2+(2k+1)=(k+1)^2" /></div><div class="reason">Add the next odd number</div></div>
</div>

<p v-click="4" class="takeaway direct-proof-takeaway">By induction, <MathTex tex="P(n)" /> holds for every positive integer n.<span class="proof-qed" aria-label="QED"></span></p>

<!--

Let's write the proof carefully. P of n is the statement that the first n positive odd numbers sum to n squared.

[click] Base case: at n equals one, the sum is one and the right-hand side is one squared. True.

[click] For the inductive step, let k be an arbitrary positive integer and suppose P of k holds. That lets us replace the sum through two k minus one with k squared.

[click] The next odd number is two k plus one. Add it to both sides. The new sum is k squared plus two k plus one, which factors as k plus one squared. That's exactly P of k plus one.

[click] We've proved the starting case and the implication for any positive integer k. By induction, the identity holds for every positive integer n.

This is much stronger than checking the first hundred sums. The step contains no upper limit. The same argument that gets us from five to six also gets us from a trillion to a trillion and one.

The visual border and the algebra express the same mechanism.
-->

---
section: CONSTRUCTION
clicks: 2
time: '18:15–19:00'
---


<div class="proof-method-label">06 / Construction</div>

# Sometimes one example is enough

<p class="lead">There exists a prime integer that is the sum of two squares of positive integers.</p>

<div v-click="1" class="witness"><div class="big-witness">5</div><div class="witness-detail"><MathTex tex="5=1^2+2^2" /></div></div>

<div v-click="2" class="aside">5 is prime. Both 1 and 2 are positive integers.<br />The witness satisfies every requirement.<span class="proof-qed" aria-label="QED"></span></div>

<!--

After all those universal claims, here's an existence statement: there exists a prime integer that is the sum of two squares of positive integers.

[click] I give you five. It's one squared plus two squared.

[click] Five is prime, and one and two are positive integers. So this object meets every condition, and the proof is complete.

This is proof by construction. Produce the object and verify the requirements. We're not claiming every prime has this property, and we don't need to find every example.

This connects back to quantifiers. One example is weak evidence for a universal statement, but it can completely settle an existence statement. The amount of evidence you need depends on the exact thing you're claiming.
-->

---
section: CHOOSING A METHOD
clicks: 4
time: '19:00–19:45'
---


# What would you try?

<div class="choice-list">
  <div><span class="index">A</span><span>Every odd integer is prime.</span><span v-click="1" class="answer">Counterexample: 9</span></div>
  <div><span class="index">B</span><span>The sum of two even integers is even.</span><span v-click="2" class="answer">Direct proof</span></div>
  <div><span class="index">C</span><span><MathTex tex="1+2+\cdots+n=\frac{n(n+1)}{2}" /></span><span v-click="3" class="answer">Induction is one option</span></div>
</div>

<p v-click="4" class="takeaway">The statement's structure suggests a method. It rarely forces just one.</p>

<!--

Three claims. Don't prove them completely. Just tell me a sensible first move.

First: every odd integer is prime. What would you try?

[PAUSE.]

[click] A counterexample. Nine is odd and composite. One is also an allowed counterexample, because one isn't prime. Nine avoids that definitional distraction.

Second: the sum of two even integers is even.

[PAUSE.]

[click] Direct proof is natural. Write the numbers as two r and two s, add, then factor out two.

Third: the sum from one through n equals n times n plus one over two, for positive integers n.

[PAUSE.]

[click] Induction fits, because moving from n to n plus one adds one new term. A pairing argument also works.

[click] These methods are tools, and many claims admit more than one good proof.
-->

---
class: dark game-slide
section: PROOF OR BLUFF?
transition: wipe
time: '19:45–25:45'
---

# Proof or bluff?

<ActivityLauncher kind="proof" />

<!--
Same phones, new challenge. Five arguments. Vote A for a valid proof, B for a broken proof. The conclusion alone isn't enough: judge the reasoning. You can change your mind until I lock the vote.

A correct majority earns the class a point. Otherwise, the traps score. A tie goes to the traps; a round with no votes earns neither side a point. After locking, someone has to defend the answer.

ROUND 1 — ABOUT 60 SECONDS

Apparently we're proving one equals two. Start with a equals b equals one. Find the first illegal step.

[PAUSE. Lock voting, ask for a reason, and reveal. Offline: enter the majority's vote and reveal.]

The last line canceled a minus b. But that factor is zero. The preceding equation was just zero equals zero. Dividing by zero cannot turn it into a plus b equals b.

[DO: Next round.]

ROUND 2 — ABOUT 60 SECONDS

Now, n cubed minus n is divisible by three for every integer n. The vertical bar means divides. Does this argument cover every integer?

[PAUSE. Lock, ask for justification, and reveal.]

Yes. The factorization gives three consecutive integers. One must be divisible by three, so their product is too. This covers negative integers and zero as well.

[DO: Next round.]

ROUND 3 — ABOUT 60 SECONDS

This argument claims every positive integer equals the next one. It assumes the claim at k, adds one, and obtains the next case. What's your verdict?

[PAUSE. Lock, ask what's missing, and reveal.]

The conditional step is valid, but there is no true base case. At one, the statement is one equals two. An implication doesn't establish its own hypothesis. The chain never starts.

[DO: Next round.]

ROUND 4 — ABOUT 60 SECONDS

We already proved this claim: if an integer's square is even, the integer is even. But does this argument prove it?

[PAUSE. Lock, ask which direction was proved, and reveal.]

No. This starts by assuming the integer is even, then shows its square is even. That's the converse. The conclusion is true, but this argument has not established it. That's why the game asks about proofs, not just answers.

[DO: Next round.]

ROUND 5 — ABOUT 90 SECONDS

Can an irrational number raised to an irrational power be rational? Here's an existence proof. Let x be square root of two raised to square root of two. If x is rational, that expression already gives us the required example. If x is irrational, raise x to square root of two. The result is two.

The argument never decides which case we're in. Is that a problem?

[PAUSE. Lock, take one explanation, and reveal.]

It isn't. Either x is rational or it isn't. In each case, we have positive irrational numbers a and b whose power is rational. The two cases cover every possibility. We proved existence without determining which of these constructions supplies the witness.

[DO: Final score. Let the class react.]

The question behind every round was: what exactly permits the next step?

[DO: Switch your shared screen back to Slidev and advance to slide 25.]
-->

---
section: THE TOOLKIT
time: '25:45–26:35'
---


# A practical proof toolkit

<div class="tool-map">
  <div><span>The definitions give you a path forward</span><span class="tool">Direct proof</span></div>
  <div><span>The possibilities split naturally</span><span class="tool">Cases, with full coverage</span></div>
  <div><span>"Not Q" is easier to work with</span><span class="tool">Contrapositive</span></div>
  <div><span>The negation forces an impossibility</span><span class="tool">Contradiction</span></div>
  <div><span>Each integer case builds on the previous one</span><span class="tool">Induction</span></div>
  <div><span>The claim says something exists</span><span class="tool">Construct a witness</span></div>
  <div><span>A universal claim looks suspicious</span><span class="tool">Hunt for a counterexample</span></div>
</div>

<!--

Here's the toolkit in one place. Start by reading the exact statement. Identify the domain, the quantifiers, and the assumptions. Then ask what the definitions give you.

If you can move forward from them, try direct proof. If the input has distinct possibilities, split into cases and check that you've covered them all. If not Q is easier to use than P, the contrapositive may simplify the argument.

If the negation creates an impossible situation, contradiction may work. If you're building a result through the positive integers, look for an induction step and remember the base case. For an existence claim, see whether you can construct a witness.

And keep testing suspicious claims. Counterexamples aren't failed mathematics. They tell you exactly where a claim needs to change.

These are useful starting points, not rigid rules. A good proof often combines several methods, just as our irrationality proof used a lemma proved by contrapositive.
-->

---
section: THE LAST CHALLENGE
clicks: 2
time: '26:35–27:50'
---


# If n² is odd, n is odd

<p class="small">Domain: integers. Which move would you try first?</p>

<div class="exit-options"><span><b>A</b>Test 20 odd numbers</span><span><b>B</b>Use the contrapositive</span><span><b>C</b>Assume n is odd</span></div>

<div v-click="1" class="exit-proof"><div class="micro">CONTRAPOSITIVE</div><div class="math-big"><MathTex tex="n\text{ even}\ \Rightarrow\ n^2\text{ even}" /></div></div>
<div v-click="2"><div class="math-big"><MathTex tex="n=2k\quad\Rightarrow\quad n^2=4k^2=2(2k^2)" /></div><p class="takeaway">The contrapositive holds, so the original claim holds.</p></div>

<!--

Last challenge. For an integer n, if n squared is odd, then n is odd. Which first move actually helps prove this: testing twenty odd numbers, using the contrapositive, or assuming n is odd?

Take a moment. If you choose the contrapositive, try to write it in your head.

[PAUSE. Ask someone for the contrapositive.]

[click] The contrapositive is: if n is even, then n squared is even. That reverses the implication and negates both parts.

[click] Write n as two k. Then n squared is four k squared, which is twice the integer two k squared. So it's even. The contrapositive is true, which proves the original statement.

Testing twenty values leaves the universal claim unfinished. Assuming n is odd starts from the conclusion and proves the converse instead. It might prove something true, but it doesn't establish the implication we were asked for.

The direction of the argument matters just as much as the algebra.
-->

---
class: dark closing
section: QUESTIONS
transition: wipe
time: '27:50–30:00'
---


<div class="display large-word">What makes<br />the next step<br /><span>unavoidable?</span></div>

<p class="closing-sub">That is where the proof lives.</p>

<div class="q-and-a">QUESTIONS / CHALLENGE A STEP / TRY ANOTHER PROOF</div>

<!--

If you keep one habit from this, make it asking what makes the next step unavoidable.

An example can suggest a pattern. A definition can make it precise. A proof tells us why every required case has to work, or a counterexample tells us why the claim can't survive.

That's the difference between recognizing a pattern and knowing what you can actually rely on.

What part would you challenge, or want to see another example of?

[PAUSE for questions.]

[IF THE ROOM IS QUIET: Ask, "Could we prove the odd-number sum without induction?" Let someone describe the general square-border argument. Or ask, "Can a true statement have an invalid proof?" Refer to slide 13: proving that an even integer has an even square does not, by itself, prove the reverse implication. The reverse is true, but that argument does not establish it.]

[STOP HERE. The next slide is a reference appendix, outside the timed talk.]
-->

---
hideFooter: true
section: REFERENCES
time: 'Appendix / not timed'
---

# The proofs behind the presentation

<div class="sources-list"><div><a href="https://arxiv.org/abs/1608.07936" target="_blank">Frenkel & Pelikán · The 52-digit counterexample ↗</a><p>American Mathematical Monthly, 2017 · Example 1(b).</p></div>
  <div><a href="https://richardhammack.github.io/BookOfProof/" target="_blank">Richard Hammack, Book of Proof ↗</a><p>Logic: Chapter 2. Proof methods: Chapters 4–7.<br />Counterexamples and induction: Chapters 9–10. Free textbook.</p></div>
  <div><a href="https://slides.zaydkrunz.com" target="_blank" rel="noopener noreferrer">slides.zaydkrunz.com ↗</a><p>Presentation framework. Mathematical notation rendered with KaTeX.<br />The live demos run locally in the browser.</p></div>
</div>

<!--
If you want more examples, Richard Hammack's Book of Proof is a free textbook that covers these techniques in much more detail. Chapter 2 develops the logic, Chapters 4 through 6 cover our basic proof methods, and Chapters 7, 9, and 10 cover existence, disproof, and induction. The opening counterexample comes from the number-theory paper listed here.

The opening shared-factor example is from Frenkel and Pelikán.
-->
