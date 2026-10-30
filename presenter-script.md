# Prove It: presenter script

Zayd Krunz · 30-minute capstone presentation

The script below is also embedded in Slidev's presenter notes. Read the prose aloud. Bracketed directions, timing labels, and reference lists are not spoken. [click] means advance one animation step with Right Arrow or Space. On interactive slides, use the visible buttons. The schedule includes audience pauses and 90 seconds for the closing and questions.

## Slide 1

TIME: 0:00–0:25 (25 seconds; audience cues included)

Today we're talking about proofs. This is technically happening in differential equations, but you can put the differential equations away for half an hour.

The question is simple: when does a mathematical claim actually deserve our trust? We'll try to break a pattern, learn a few proof techniques, and play a game about catching bad arguments.

You need algebra and a willingness to be suspicious. Phones out for the first challenge.

---

## Slide 2

TIME: 0:25–3:00 (155 seconds; audience cues included)

[BEFORE CLASS: Open /host privately, create a new room, and open both deck and presenter view from it. Both activities use this one room. Start the hunt only when the class is ready.]

Scan the QR code. Keep that phone page open; we'll use it again later. No account or name needed.

Here's the challenge. Enter any nonnegative whole number. We calculate two numbers: n to the seventeenth plus nine, and n plus one, all to the seventeenth, plus nine. Find an input where those two results share a factor greater than one.

For example, twelve and twenty-five have no shared factor above one. Twelve and eighteen share six. The app checks that for you. GCD means greatest common divisor: a result of one means no shared factor above one.

[PAUSE up to 25 seconds for joining. Explain the rule while they scan.]

You have exactly one minute. Try small numbers, big numbers, whatever you like. You can enter up to a hundred digits. Ready?

[DO: Click Start the 60 seconds. Let the full minute run. If phones fail, choose Use call-out guesses and enter audience suggestions on the projector.]

[OPTIONAL DURING THE TIMER: The factor lists show prime factors the app has verified. A huge remaining piece might be labeled unfactored. That does not affect the exact shared-factor calculation. Keep going.]

[WHEN THE TIMER ENDS: If someone found it, acknowledge their result. Otherwise:]

Lots of tests. Still no shared factor. Is that a proof that there's never one?

[DO: Click Reveal the counterexample.]

The first input that breaks the pattern has fifty-two digits. That is not a typo. Let's look at what it means.

---

## Slide 3

TIME: 3:00–3:50 (50 seconds; audience cues included)

Every smaller nonnegative integer passes this test. The first counterexample is this fifty-two-digit number.

[click] At this input, both results share the factor shown here. The app uses exact integer arithmetic, so this is not a rounding error. We can divide both numbers by that factor with zero remainder.

This is a published number-theory example. We are not going to prove why this is the first failure today. But verifying a counterexample is enough to disprove the claim that there are no failures.

[click] People sometimes call this proof by counterexample. More precisely, it disproves the universal statement and proves its negation. Successful tests can suggest a pattern. One allowed failure destroys it.

---

## Slide 4

TIME: 3:50–4:30 (40 seconds; audience cues included)

A proof starts with assumptions, definitions, and results we've already established. It then gives a chain of reasoning that forces the conclusion.

[click] Every step needs a reason. It might use a definition, a valid algebraic operation, or a theorem. Looking plausible is not a reason.

[click] And the conclusion has to be the exact claim we promised, with the right domain and every required case covered.

We'll write readable mathematical proofs, rather than translate every sentence into a formal symbolic system. But the logic underneath is the same. Someone should be able to challenge any step and get a real answer.

Before we build those arguments, let's get a little more precise about what statements mean.

---

## Slide 5

TIME: 4:30–5:15 (45 seconds; audience cues included)

A proposition is a statement that is true or false. Seven is prime is a proposition. Please open the window is a request, so it isn't one. And x is greater than three needs a value for x, or a quantifier, before it gives us a complete claim.

We'll call statements P and Q. Not P reverses the truth value.

[click] P and Q requires both statements to be true.

[click] P or Q requires at least one. Mathematical or is inclusive, so both being true is allowed. Think of the difference between an entry requirement and a restaurant making you choose exactly one side dish.

[click] Finally, if P then Q says P guarantees Q. This is the shape of a huge number of theorems, and it has one slightly weird feature worth unpacking.

---

## Slide 6

TIME: 5:15–6:25 (70 seconds; audience cues included)

Suppose I say, if you ace the test, I'll buy you pizza. P means you aced the test, and Q means you got pizza. Which situation breaks my promise?

[DO: Start with both TRUE. Toggle Got pizza to FALSE. Ask the room before explaining.]

You aced the test, but no pizza. That's the one forbidden situation: P is true and Q is false.

[DO: Toggle Aced the test to FALSE, leaving pizza FALSE.]

Now you didn't ace it, and there's no pizza. Disappointing, maybe, but the promise never said what happens if you don't ace the test.

[DO: Toggle Got pizza to TRUE, with P still FALSE.]

And if you didn't ace it but got pizza anyway, the promise still holds. I can buy pizza for other reasons. That's why the bottom two rows are true.

This is the truth table for material implication. It describes a logical condition, not necessarily a cause. To disprove an if-then claim, you need a case where the hypothesis holds and the conclusion fails. That's the exact kind of failure we're hunting.

[DO: Return to TRUE / FALSE to emphasize the only failing row.]

---

## Slide 7

TIME: 6:25–7:15 (50 seconds; audience cues included)

Here's a true implication over the integers: if a number is divisible by four, it's even.

[click] Reverse that and we get: if a number is even, it's divisible by four. That's the converse, and six destroys it. The original implication did not give us permission to run the arrow backward.

[click] But there is a way to turn it around safely. Reverse the arrow and negate both statements. If a number is not even, then it is not divisible by four. That's the contrapositive, and it is logically equivalent to the original.

Both rule out exactly the same bad case: divisible by four but not even. We'll use this equivalence as an actual proof technique in a few minutes.

If a theorem says if and only if, it promises both directions. Both need justification.

---

## Slide 8

TIME: 7:15–8:00 (45 seconds; audience cues included)

These two symbols tell us how much work a claim requires. The upside-down A means for every. For every integer n, n squared is nonnegative. A universal statement ranges over its entire domain.

[click] The backward E means there exists. There exists an integer whose square is nine. Here I can give you three, check that three squared is nine, and I'm done. That example is called a witness.

Notice how one example has completely different power depending on the quantifier. A successful example proves an existence claim. A failing example disproves a universal claim.

Also, say what the domain is. The equation x squared equals two has a real solution. It has no integer solution. Changing the allowed objects changes the statement, even when the equation looks identical.

---

## Slide 9

TIME: 8:00–8:40 (40 seconds; audience cues included)

Quick vote. The statement is: every student solved the puzzle. Is its negation A, no student solved it, or B, at least one student did not solve it?

[PAUSE: Ask for hands for A and B.]

[click] It's B. To make every student solved it false, we only need one student who didn't. A is much stronger than necessary. Imagine twenty people solved it and one didn't. The original claim is false, but A is also false.

Negating for every gives us there exists, with the inside statement negated. Negating there exists works the other way: for every, not. This matters because proof by contradiction begins by assuming the exact negation of our target.

---

## Slide 10

TIME: 8:40–9:10 (30 seconds; audience cues included)

Now we have enough language to build proofs. These are six useful approaches, and we'll actually use each one.

Direct proof follows the assumptions forward. Cases split the possibilities. Contrapositive changes the direction safely. Contradiction asks what would happen if the target were false. Induction builds an infinite chain. Construction gives us an object that works.

[click] But before any of those, check whether the claim is true. Try a few small values, zero when it's allowed, and negative numbers when they're allowed. Testing can guide a proof, and a counterexample can end a doomed proof attempt very quickly.

---

## Slide 11

TIME: 9:10–10:15 (65 seconds; audience cues included)

Let's prove that the sum of two odd integers is even. We choose arbitrary odd integers a and b. Arbitrary means we're not selecting special values that make the argument easy.

[click] The definition of odd tells us that a equals two r plus one and b equals two s plus one, where r and s are integers.

Why different letters? Because the two odd numbers don't have to be equal. Writing both as two r plus one would quietly restrict our claim.

[click] Add them and combine the terms. We get two r plus two s plus two.

[click] Factor out two. The result is twice r plus s plus one. The quantity inside the parentheses is an integer, so this is even by definition.

That last sentence is the actual finish. We haven't just simplified an expression. We've connected it to the definition of the thing we promised to prove.

Nothing depended on a particular choice of a or b, so the proof covers every pair of odd integers, including negative ones.

---

## Slide 12

TIME: 10:15–11:00 (45 seconds; audience cues included)

Now let's prove that n times n plus one is even for every integer n. These are two consecutive integers.

[click] Case one: n is even. Then n is two k for some integer k. Our product is two times an integer, so it's even.

[click] Case two: n is odd. Then n is two k plus one, which makes n plus one equal to two k plus two. This time the second factor is even, and the product is still even.

The essential sentence is that every integer is either even or odd. We've covered the whole domain. A proof by cases needs every possible case to be covered. They can overlap, but they can't leave a gap.

Checking only positive and negative integers, for example, would miss zero. Tiny omissions are how large claims escape.

---

## Slide 13

TIME: 11:00–12:10 (70 seconds; audience cues included)

Our next claim is that if an integer's square is even, the integer itself is even. We need a justification. Saying it's obvious because even times even is even would run the implication in the wrong direction.

[click] Instead, use the contrapositive. If n is not even, its square is not even. For integers, that's the same as saying if n is odd, n squared is odd.

[click] Suppose n is odd. Then n is two k plus one for an integer k.

[click] Square it. We get four k squared plus four k plus one. Rewrite that as two times the integer two k squared plus two k, then plus one. That's odd.

We've proved the contrapositive, so we've proved the original implication. An odd integer can't have an even square. Therefore an integer with an even square must be even.

Keep this result. In a moment we'll use it twice inside a different proof. This is how mathematical arguments build on each other instead of starting over every time.

---

## Slide 14

TIME: 12:10–12:45 (35 seconds; audience cues included)

Proof by contradiction starts by assuming the exact opposite of what we want to prove.

[click] We then follow valid steps until that assumption forces an impossibility. For example, a quantity might have to be both even and odd, or a fraction might have to be both in lowest terms and reducible.

[click] That means the extra assumption cannot hold, so the original target does hold, under our standing assumptions.

This differs from contrapositive. Contrapositive directly proves an equivalent implication. Contradiction assumes a negation and drives it into a wall. The wall has to be a real contradiction. I don't like this result is not a proof technique.

---

## Slide 15

TIME: 12:45–13:45 (60 seconds; audience cues included)

Let's prove that the square root of two is irrational. Assume the opposite: it equals a over b, with a and b integers and b positive. We choose that fraction in lowest terms.

[click] Rational means expressible as a ratio of integers. Irrational means no such ratio exists. A long decimal display can't settle this. A rational number can also have an infinite decimal expansion, like one third. So we need an argument about all possible fractions.

[click] Lowest terms means a and b share no integer factor greater than one. We can always reduce a rational fraction, just as six over four reduces to three over two.

That condition is going to matter. We'll show that our supposedly reduced numerator and denominator must both be even. Then two would divide both of them, directly contradicting the way we chose the fraction.

Remember the result we just proved: an even square has an even integer root.

---

## Slide 16

TIME: 13:45–15:00 (75 seconds; audience cues included)

Start with square root of two equals a over b.

[click] Square both sides and multiply by b squared. We get a squared equals two b squared. So a squared is even. Our earlier lemma tells us a itself is even.

[click] Write a as two k. Substitution gives four k squared equals two b squared.

[click] Divide by two, and b squared equals two k squared. That makes b squared even, so the same lemma tells us b is even too.

Before I reveal the finish, what have we just shown about the fraction?

[PAUSE for a response, about 5 seconds.]

[click] Both numerator and denominator have a factor of two. But we chose a fraction with no common factor greater than one. Those conditions cannot both hold.

So the assumption that square root of two is rational fails. There is no integer fraction representing it.

Notice how precise the contradiction is. We didn't say the fraction looks unlikely. We found two incompatible facts about the very same fraction.

---

## Slide 17

TIME: 15:00–16:20 (80 seconds; audience cues included)

Induction proves a statement for every positive integer using two jobs. First, prove the base case, usually one. Second, prove that for an arbitrary integer k in the domain, if the statement holds at k, it must hold at k plus one.

[DO: Leave both switches ON and click Run the chain.]

The first domino falls, and every link carries the result forward. That's the picture.

[DO: Turn Base case OFF and run again.]

What happens with every link but no starting point? Nothing. An implication doesn't establish its own hypothesis.

[DO: Turn Base case ON, turn Every link OFF, and run again.]

Now the base works, but it can't get us anywhere else. A successful first example is not enough either.

[DO: Restore both ON and run.]

The picture has eight dominoes. The proof needs the step for every integer k at least one. That's what lets the chain reach any positive integer, however large.

And assuming P of k inside the step isn't circular. We're proving a conditional. The independently proved base case is what starts that chain.

---

## Slide 18

TIME: 16:20–17:05 (45 seconds; audience cues included)

Here's the claim we'll prove by induction: the first n positive odd integers add up to n squared.

One square, then three more, gives a two-by-two square. Add five, and it's three-by-three.

[DO: Start at n = 3. Click Add a layer twice.]

Each new L-shaped border turns a square into the next larger square. To grow a k-by-k square to a k-plus-one-by-k-plus-one square, the border contains k squares along one side, k along the other, plus the corner. That's two k plus one.

The diagram makes the next odd number feel inevitable. But showing a few sizes is still only showing a few sizes. We can turn the general border argument into a proof, or write the same idea algebraically using induction. Let's do that.

---

## Slide 19

TIME: 17:05–18:15 (70 seconds; audience cues included)

Let's write the proof carefully. P of n is the statement that the first n positive odd numbers sum to n squared.

[click] Base case: at n equals one, the sum is one and the right-hand side is one squared. True.

[click] For the inductive step, let k be an arbitrary positive integer and suppose P of k holds. That lets us replace the sum through two k minus one with k squared.

[click] The next odd number is two k plus one. Add it to both sides. The new sum is k squared plus two k plus one, which factors as k plus one squared. That's exactly P of k plus one.

We've proved the starting case and the implication for any positive integer k. By induction, the identity holds for every positive integer n.

This is much stronger than checking the first hundred sums. The step contains no upper limit. The same argument that gets us from five to six also gets us from a trillion to a trillion and one.

The visual border and the algebra express the same mechanism.

---

## Slide 20

TIME: 18:15–19:00 (45 seconds; audience cues included)

After all those universal claims, here's an existence statement: there exists a prime integer that is the sum of two squares of positive integers.

[click] I give you five. It's one squared plus two squared.

[click] Five is prime, and one and two are positive integers. So this object meets every condition, and the proof is complete.

This is proof by construction. Produce the object and verify the requirements. We're not claiming every prime has this property, and we don't need to find every example.

This connects back to quantifiers. One example is weak evidence for a universal statement, but it can completely settle an existence statement. The amount of evidence you need depends on the exact thing you're claiming.

---

## Slide 21

TIME: 19:00–19:45 (45 seconds; audience cues included)

Three claims. Don't prove them completely. Just tell me a sensible first move.

First: every odd integer is prime. What would you try?

[PAUSE about 5 seconds.]

[click] A counterexample. Nine is odd and composite. One is also an allowed counterexample, because one isn't prime. Nine avoids that definitional distraction.

Second: the sum of two even integers is even.

[PAUSE about 5 seconds.]

[click] Direct proof is natural. Write the numbers as two r and two s, add, then factor out two.

Third: the sum from one through n equals n times n plus one over two, for positive integers n.

[PAUSE about 5 seconds.]

[click] Induction fits, because moving from n to n plus one adds one new term. A pairing argument also works. These methods are tools, and many claims admit more than one good proof.

---

## Slide 22

TIME: 19:45–25:45 (360 seconds; audience cues included)

[BEFORE STARTING: On this slide click Open Proof or Bluff, then Start round 1. The same room and phone page carry over from the opening hunt. Late arrivals can scan the QR again. If using the offline version, click Restart.]

Same phones, new challenge. Five arguments. Vote A for a valid proof, B for a broken proof. The conclusion alone isn't enough: judge the reasoning. You can change your mind until I lock the vote.

A correct majority earns the class a point. Otherwise, the traps score. A tie goes to the traps; a round with no votes earns neither side a point. After locking, someone has to defend the answer.

ROUND 1 — ABOUT 60 SECONDS

Apparently we're proving one equals two. Start with a equals b equals one. Find the first illegal step.

[PAUSE 15 seconds. Lock voting, ask for a reason, and reveal. Offline: enter the majority's vote and reveal.]

The last line canceled a minus b. But that factor is zero. The preceding equation was just zero equals zero. Dividing by zero cannot turn it into a plus b equals b.

[DO: Next round.]

ROUND 2 — ABOUT 60 SECONDS

Now, n cubed minus n is divisible by three for every integer n. The vertical bar means divides. Does this argument cover every integer?

[PAUSE 15 seconds. Lock, ask for justification, and reveal.]

Yes. The factorization gives three consecutive integers. One must be divisible by three, so their product is too. This covers negative integers and zero as well.

[DO: Next round.]

ROUND 3 — ABOUT 60 SECONDS

This argument claims every positive integer equals the next one. It assumes the claim at k, adds one, and obtains the next case. What's your verdict?

[PAUSE 15 seconds. Lock, ask what's missing, and reveal.]

The conditional step is valid, but there is no true base case. At one, the statement is one equals two. An implication doesn't establish its own hypothesis. The chain never starts.

[DO: Next round.]

ROUND 4 — ABOUT 60 SECONDS

We already proved this claim: if an integer's square is even, the integer is even. But does this argument prove it?

[PAUSE 15 seconds. Lock, ask which direction was proved, and reveal.]

No. This starts by assuming the integer is even, then shows its square is even. That's the converse. The conclusion is true, but this argument has not established it. That's why the game asks about proofs, not just answers.

[DO: Next round.]

ROUND 5 — ABOUT 90 SECONDS

Can an irrational number raised to an irrational power be rational? Here's an existence proof. Let x be square root of two raised to square root of two. If x is rational, that expression already gives us the required example. If x is irrational, raise x to square root of two. The result is two.

The argument never decides which case we're in. Is that a problem?

[PAUSE 20 seconds. Lock, take one explanation, and reveal.]

It isn't. Either x is rational or it isn't. In each case, we have positive irrational numbers a and b whose power is rational. The two cases cover every possibility. We proved existence without determining which of these constructions supplies the witness.

[DO: Final score. Allow about 10 seconds for the result.]

The question behind every round was: what exactly permits the next step?

---

## Slide 23

TIME: 25:45–26:35 (50 seconds; audience cues included)

Here's the toolkit in one place. Start by reading the exact statement. Identify the domain, the quantifiers, and the assumptions. Then ask what the definitions give you.

If you can move forward from them, try direct proof. If the input has distinct possibilities, split into cases and check that you've covered them all. If not Q is easier to use than P, the contrapositive may simplify the argument.

If the negation creates an impossible situation, contradiction may work. If you're building a result through the positive integers, look for an induction step and remember the base case. For an existence claim, see whether you can construct a witness.

And keep testing suspicious claims. Counterexamples aren't failed mathematics. They tell you exactly where a claim needs to change.

These are useful starting points, not rigid rules. A good proof often combines several methods, just as our irrationality proof used a lemma proved by contrapositive.

---

## Slide 24

TIME: 26:35–27:50 (75 seconds; audience cues included)

Last challenge. For an integer n, if n squared is odd, then n is odd. Which first move actually helps prove this: testing twenty odd numbers, using the contrapositive, or assuming n is odd?

Take fifteen seconds. If you choose the contrapositive, try to write it in your head.

[PAUSE 15 seconds. Ask someone for the contrapositive.]

[click] The contrapositive is: if n is even, then n squared is even. That reverses the implication and negates both parts.

[click] Write n as two k. Then n squared is four k squared, which is twice the integer two k squared. So it's even. The contrapositive is true, which proves the original statement.

Testing twenty values leaves the universal claim unfinished. Assuming n is odd starts from the conclusion and proves the converse instead. It might prove something true, but it doesn't establish the implication we were asked for.

The direction of the argument matters just as much as the algebra.

---

## Slide 25

TIME: 27:50–30:00 (130 seconds; audience cues included)

If you keep one habit from this, make it asking what makes the next step unavoidable.

An example can suggest a pattern. A definition can make it precise. A proof tells us why every required case has to work, or a counterexample tells us why the claim can't survive.

That's the difference between recognizing a pattern and knowing what you can actually rely on.

What part would you challenge, or want to see another example of?

[PAUSE for questions. Allow about 90 seconds, or use this as the timing buffer if earlier discussion ran long.]

[IF THE ROOM IS QUIET: Ask, "Could we prove the odd-number sum without induction?" Let someone describe the general square-border argument. Or ask, "Can a true statement have an invalid proof?" Refer to slide 13: proving that an even integer has an even square does not, by itself, prove the reverse implication. The reverse is true, but that argument does not establish it.]

[STOP HERE. The next slide is a reference appendix, outside the timed talk.]

---

## Slide 26

APPENDIX: Not part of the 30-minute schedule.

If you want more examples, Richard Hammack's Book of Proof is a free textbook that covers these techniques in much more detail. Chapter 2 develops the logic, Chapters 4 through 6 cover our basic proof methods, and Chapters 7, 9, and 10 cover existence, disproof, and induction. The opening counterexample comes from the number-theory paper listed here.

REFERENCES (not spoken):
- Richard Hammack, Book of Proof, author-hosted third edition: https://richardhammack.github.io/BookOfProof/
- Slidev documentation: https://sli.dev/guide/animations and https://sli.dev/features/latex

The opening shared-factor example is from Frenkel and Pelikán, "On the greatest common divisor of the value of two polynomials," Example 1(b), American Mathematical Monthly 124 (2017), 446–450: https://arxiv.org/abs/1608.07936. The prime-factor display certifies factors only within its deterministic test range and labels every unresolved remainder.

All numerical examples, game rounds, and demo logic are included in the local source. Phone voting uses the presentation's own server. The show-of-hands version and all other demos also work locally without an internet connection.
