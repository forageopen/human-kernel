// Curated quote bank (2026-08-03, direct request: "i wanna add this quote
// that timed around 7-11 seconds depending on its length... below is the
// quote... i think you may choose to not include any quote that's longer
// than your targeted area... rule. never paraphrase, just take part, spec,
// italic for poetic. keep the high caps for the one that is high caps.
// adjust to sentence caps when necessary. i want it to shuffle & loop. maybe
// create a toggle button mode for quote islamic/philosophy/relationship/
// dream"). Source material: the uploaded "Quote from X 1.md" (~130 raw
// entries, evidently saved from social media). This module is pure data +
// pure helpers - no localStorage, no DOM - the same boundary this codebase
// already draws between notepad.ts's HIGHLIGHT_COLORS data and its render/
// wire functions. See quote-widget.ts for the shuffle/loop queue, category
// persistence, and DOM wiring built on top of this.
//
// Curation rules actually applied here:
//  - Verbatim only. Nothing below is paraphrased. Where a quote exceeds
//    MAX_QUOTE_LENGTH, it's either excerpted (a contiguous cut, marked with
//    "…" at the cut point - never reworded) or dropped entirely if it can't
//    be excerpted without becoming misleading (e.g. a numbered list that
//    only makes sense whole).
//  - "keep the high caps... adjust to sentence caps when necessary": original
//    ALL-CAPS emphasis is preserved (e.g. "ONLY", "NOT", "WILL"). A handful
//    of entries that were plainly just missing an initial capital (not a
//    deliberate lowercase-aesthetic choice) were sentence-cased; the many
//    entries with a deliberate full-lowercase style are left as typed -
//    that's a voice choice in the original, not a transcription error.
//  - Grammar/spelling quirks already in the source (e.g. "Thing are only
//    embarrassing", "procrastine", "feed with information") are preserved
//    as-is - fixing them would mean inserting words that weren't there.
//  - Citations/attributions are lifted out of the quote body into `source`
//    so the quote text itself stays exactly what was said/written.
//  - `poetic: true` is set only on the handful of entries with real verse
//    structure (a dua, a couplet) - quote-widget.ts renders these in italics
//    per the direct request; everything else renders as plain text.
//
// Assumption flagged (no definition was given for the 4th category): "dream"
// is read here as the ambition / hustle / wealth-building / goal-execution
// cluster of the source material - the quotes driven by drive and momentum,
// as distinct from religious practice (islamic), reflective/existential
// material (philosophy), or interpersonal dynamics (relationship). Adam can
// correct this reading; nothing structural depends on the category NAME.
//
// Explicitly excluded, with reasons (not silently dropped):
//  - The Imam Shafi'i "treasures of a person" entry (three-bullet list that
//    is itself cut off mid-sentence in the source, with no way to verify
//    how it ended) - including it as if complete would misrepresent it.
//  - The "4 promises from Allah" list, the "My super productive day
//    formula" 7-step list, the "$100K" savings-plan list, and the "toxic
//    workplace" bullet list - each is long-form and structured such that
//    cutting any item would make the rest read as incomplete/arbitrary
//    rather than a clean excerpt.
//  - "I don't need your praise to survive... I will constitute the field." -
//    reads as it may be adapted from an existing poem; provenance couldn't
//    be confirmed from the source file, so it's left out rather than risk
//    misattributing or reproducing someone else's uncredited work.
//  - "spiritually here rn" - too dependent on missing context to stand alone.
//  - The early-marriage-age social commentary entry - a contested normative
//    claim that reads as an isolated policy opinion rather than a quote with
//    lasting resonance; there was no shortage of stronger material.
//  - One of two near-duplicate Ash-Shafi'i "what makes a man lose his honor"
//    entries - kept the better-cited version, dropped the redundant one.

export type QuoteCategory = "islamic" | "philosophy" | "relationship" | "dream";

export const CATEGORY_CYCLE: readonly QuoteCategory[] = ["islamic", "philosophy", "relationship", "dream"];

export const CATEGORY_LABELS: Record<QuoteCategory, string> = {
  islamic: "Islamic",
  philosophy: "Philosophy",
  relationship: "Relationship",
  dream: "Dream",
};

export interface Quote {
  text: string;
  category: QuoteCategory;
  /** Attribution/citation, kept out of `text` itself. Absent for untraced/
   * anonymous saves - most of the source file has no named author. */
  source?: string;
  /** Verse-structured entries only (a dua, a couplet) - direct request:
   * "italic for poetic." */
  poetic?: boolean;
}

/** Hard ceiling on display length (2026-08-03, direct request: "you may
 * choose to not include any quote that's longer than your targeted area").
 * The widget is a small hover-peek strip, not a reading pane. */
export const MAX_QUOTE_LENGTH = 280;

const MIN_DURATION_MS = 7000;
const MAX_DURATION_MS = 11000;
/** Below this length, always show for MIN_DURATION_MS - short lines don't
 * need to scale down further. */
const SHORT_LENGTH_FLOOR = 40;

/** Linear interpolation between 7s (short) and 11s (at MAX_QUOTE_LENGTH),
 * per the direct request: "timed around 7-11 seconds depending on its
 * length." Clamped at both ends, monotonic in between. */
export function computeDisplayDurationMs(text: string): number {
  const len = text.length;
  if (len <= SHORT_LENGTH_FLOOR) return MIN_DURATION_MS;
  const clampedLen = Math.min(len, MAX_QUOTE_LENGTH);
  const ratio = (clampedLen - SHORT_LENGTH_FLOOR) / (MAX_QUOTE_LENGTH - SHORT_LENGTH_FLOOR);
  return Math.round(MIN_DURATION_MS + ratio * (MAX_DURATION_MS - MIN_DURATION_MS));
}

export const QUOTES: readonly Quote[] = [
  // ---------------------------------------------------------------- islamic
  { category: "islamic", text: `Don't ask for sabr. Ask for 'afiyah.` },
  {
    category: "islamic",
    text: `Don't kick someone when he's already down. You wouldn't want that done to you. Be kind; motivate, a pat on the back, a positive word can go a long way. Be the silver lining in someone's cloud.`,
    source: "Mufti Menk",
  },
  {
    category: "islamic",
    text: `Don't waste time engaging in sin. You have the chance to start anew every day when the Almighty returns your soul to you after sleep. It's up to you to decide today how you want to live your life; in His pleasure or displeasure.`,
    source: "Mufti Menk",
  },
  {
    category: "islamic",
    text: `If you want something and you're not:\n• Praying Tahajjud for it\n• Doing lots of Istighfar\nYou don't want it enough.`,
  },
  {
    category: "islamic",
    text: `The sunnah of silence.\n- Not replying to gossip is sunnah\n- Walking away from an argument is sunnah\n- Letting go of the last word is sunnah\nSilence often speaks louder than words`,
  },
  {
    category: "islamic",
    text: `If you cannot forbid backbiting, you must leave the gathering. If you stay, you are sinning.`,
    source: "Ibn Bāz, Fatāwā Al-Mar'ah",
  },
  { category: "islamic", text: `Perkara yang mustahil bagimu, mudah bagi Allah.` },
  {
    category: "islamic",
    text: `Wallahi, saying Astaghfirullah 1000 times daily is a life-changer! Try it consistently and thank me later.`,
  },
  {
    category: "islamic",
    text: `No job?? Pray Tahajjud.. You're in stress?? Pray Tahajjud. You want something?? Pray Tahajjud. You're suffering from illness ?? Pray Tahajjud… Tahajjud prayer can change any situation for u.`,
  },
  { category: "islamic", text: `Allah didn't bring you this far to abandon you.` },
  {
    category: "islamic",
    text: `Rabbi inni Lima Anzalta\nIlayya min Khairin faqir\nMy Lord, truly, I am in need of\nWhatever good that would send down to me.`,
    source: "Qur'an 28:24",
    poetic: true,
  },
  { category: "islamic", text: `Safety lies in not wanting to be known.`, source: "Imam Sufyan al-Thawri" },
  {
    category: "islamic",
    text: `O young people, I warn you of procrastination, (saying): 'Soon, I am going to do this', and 'soon I am going to do that'`,
    source: "Hasan al-Basri, Qasr al-Amal 212/1:141",
  },
  {
    category: "islamic",
    text: `Falling in love is a disease and its cure is to marry the one you love.`,
    source: "Ibn al-Qayyim, Tibb an-Nabawī p.250",
  },
  { category: "islamic", text: `If Allah is making you wait, imagine what He has prepared for you.` },
  {
    category: "islamic",
    text: `Ordinary people love Allah because of the favors He bestows upon them, whereas the true lover loves Him purely because He is worthy of all love.`,
    source: "Imam Al-Ghazali, Ihya Ulum al-Din",
  },
  { category: "islamic", text: `Islam does not speak about boyfriends and girlfriends, it says only husband and wife.` },
  {
    category: "islamic",
    text: `Non-Mahrams can't be trusted even if they were the most fearing of Allah. For indeed, hearts change rapidly and the shaytan is on the lookout; verily the Prophet ﷺ said, "A man is not alone with a woman except that the third of them is the shaytan."`,
    source: "Ibn Taymiyyah, Sharh al-'Umdah 4/78",
  },
  {
    category: "islamic",
    text: `Do not be alone with a woman, even if you say: 'I am teaching her the Qur'an.'`,
    source: "Umar ibn Abd al-Aziz, Ḥilyat al-Awliya 5/345",
  },
  { category: "islamic", text: `As long as I never abandon my 5 daily prayers, I'll be completely okay Insha'Allah.` },
  { category: "islamic", text: `It's sunnah to tell your pain to اللہ by looking at the sky.` },
  { category: "islamic", text: `Normalise working for your akhirah with the same effort you work for this dunya, even more.` },
  {
    category: "islamic",
    text: `Leave whatever hurts you, and search for a righteous friend!`,
    source: "Umar ibn al-Khattab, al-Hilyah 7996",
  },
  {
    category: "islamic",
    text: `Whoever is easy-going, easy to deal with, and kind-hearted, Allah will forbid the Fire for him`,
    source: "Prophet Muhammad ﷺ, Sahih al-Jami' 6484",
  },
  { category: "islamic", text: `Allah's timing, not yours.` },
  {
    category: "islamic",
    text: `Stop making Allah Almighty your last option. Instead, remember that He is your ONLY solution.`,
  },
  {
    category: "islamic",
    text: `What are the most humiliating traits in a man? Excessive speech, spreading secrets, and trusting everyone.`,
    source: "Ash-Shāfi'ī, Al-Intiqā 159",
  },
  {
    category: "islamic",
    text: `The saddest lesson from Surah Yusuf is that the closest people in your life aren't always the ones who love you the most.`,
  },
  {
    category: "islamic",
    text: `"La tahzan innallaha ma'ana"\n"Don't be sad. Allah is. With us."`,
    source: "Qur'an 9:40",
    poetic: true,
  },
  { category: "islamic", text: `And Allah loves the patient ones.` },
  {
    category: "islamic",
    text: `Do not fear poverty. Allah has warned you with the Hellfire, He has not warned with poverty.`,
    source: "Hatim Al-Asam",
  },
  {
    category: "islamic",
    text: `If you knew the true value of yourself, you would never allow yourself to be humiliated by committing sins.`,
    source: "Ibn al-Qayyim, al-Fawā'id p.118",
  },
  { category: "islamic", text: `God removes, to replace.` },
  { category: "islamic", text: `Soon you'll see why Allah made you wait that long` },
  {
    category: "islamic",
    text: `It's from the Sunnah to complain to Allah alone. The Prophet never sought sympathy from the people, nor begged for their approval`,
  },
  { category: "islamic", text: `If you get angry, stay silent.`, source: "Prophet Muhammad ﷺ" },
  { category: "islamic", text: `Self-love: support yourself, pray for yourself, motivate yourself, love yourself.` },
  {
    category: "islamic",
    text: `When the deceased dies, the Angels say: 'What did he put forth?' while the people say: 'What did he leave behind?'`,
    source: "Abu Hurayrah",
  },
  {
    category: "islamic",
    text: `"What has landed you in Hell?" They will reply, "We were not of those who prayed."`,
    source: "Qur'an 74:42-43",
  },
  {
    category: "islamic",
    text: `"What is meant for you, will reach you even if it is beneath two mountains." And what isn't meant for you, won't reach you even if it is between your two lips.`,
  },
  { category: "islamic", text: `Dan akhirnya kamu akan memahami betapa pentingnya melibatkan Allah dalam setiap urusan.` },
  {
    category: "islamic",
    text: `He sees you disobeying Him, then He allows your heart to be filled with regret. Then He inspires you to seek forgiveness, so He forgives you. Then He becomes pleased with you and transforms your sins into good deeds.`,
    source: "one of the righteous Salaf, on the generosity of Allah",
  },
  {
    category: "islamic",
    text: `Do good and throw it in the sea, for if it gets lost with the servant, it won't get lost with the maker.`,
  },

  // ------------------------------------------------------------ philosophy
  { category: "philosophy", text: `May your next six months be happier than your last months.` },
  {
    category: "philosophy",
    text: `Unless you're playing at the absolute highest levels, every game in life is just you vs you. It's you vs the voice in your head that tells you you're not good enough. It's you vs the desire to quit… Just improve yourself.`,
  },
  { category: "philosophy", text: `as you got older you realised? most adults are actually very stupid.` },
  { category: "philosophy", text: `Every single time I thought I was too late, it was still early.` },
  {
    category: "philosophy",
    text: `The sooner you accept that it's going to take longer than you want, the sooner it happens faster than you expect.`,
  },
  {
    category: "philosophy",
    text: `You fear of embarrassment is making you boring. Embarrassment isn't real. Thing are only embarrassing if only you feel embarrassed. So stop feeling embarrassed.`,
  },
  { category: "philosophy", text: `kill the urge to be chosen and choose yourself.` },
  {
    category: "philosophy",
    text: `What the fuck are you afraid of? Death? We're all gonna die. Bankruptcy? You can make it all back. Shame? Everyone will forget in a week. What the fuck are you afraid of? There is nothing to fear.`,
  },
  {
    category: "philosophy",
    text: `The difference between a confident person and a delusional person isn't personality, it's proof.`,
  },
  {
    category: "philosophy",
    text: `The world will ask you who you are, and if you don't know, the world will tell you`,
    source: "Carl Jung",
  },
  { category: "philosophy", text: `I noticed real people barely have friends.` },
  { category: "philosophy", text: `Not dead yet.` },
  {
    category: "philosophy",
    text: `Be private. Accept the loneliness, and fix your life. No one is coming to save you. Your life is 100% your responsibility.`,
  },
  {
    category: "philosophy",
    text: `20 years from now you'd give anything to be this exact age, exactly this healthy, in this exact moment. Take a second to enjoy it.`,
    source: "Richard Webster",
  },
  {
    category: "philosophy",
    text: `Never let something bother you for longer than it takes to fix, someone bother you for longer than it takes to tell them, or some place bother for you for longer than it takes to leave.`,
  },
  { category: "philosophy", text: `normalize lying intentionally to anyone who asks too much about your private life.` },
  { category: "philosophy", text: `It is a very powerful manipulation to let others win the small battles.` },
  { category: "philosophy", text: `Knowing yourself is the beginning of all wisdom.`, source: "Aristotle" },
  { category: "philosophy", text: `People that actually know how to be alone are powerful people` },
  {
    category: "philosophy",
    text: `It is better to be unhappy and know the worst, than to be happy in a fool's paradise.`,
    source: "Fyodor Dostoevsky",
  },
  {
    category: "philosophy",
    text: `Uncommon advice: If you don't know what to pursue in life right now. Pursue yourself. Pursue becoming the healthiest, happiest, most healed, most present, most confident version of yourself.`,
  },
  { category: "philosophy", text: `The attempt to escape from pain is what creates more pain.`, source: "Gabor Maté" },
  { category: "philosophy", text: `Be a good person, But don't waste time to prove it.` },
  {
    category: "philosophy",
    text: `A man asked a gardener why his plants grew so beautifully. The gardener said: "I don't force them to grow. I remove what stops them."`,
  },
  { category: "philosophy", text: `The smarter you get, the less you speak.` },
  { category: "philosophy", text: `It will pass. It will pass. It will pass.` },
  { category: "philosophy", text: `"but how could you live and have no story to tell?"`, source: "Fyodor Dostoevsky" },
  { category: "philosophy", text: `Nobody Is thinking about you.` },
  { category: "philosophy", text: `You have made it to another day. Keep going.` },
  {
    category: "philosophy",
    text: `Memento Mori is latin for 'remember that you will die' or 'remember you are mortal'. Death makes our lives important and meaningful, it creates priority, and gives us the perspective to focus on what is important.`,
  },
  {
    category: "philosophy",
    text: `Stop telling everyone about every single thing you're doing. Release that need for validation. It cheapens you, and is blasphemy against that which is personal and sacred.`,
  },
  { category: "philosophy", text: `Never take rejection personally.` },
  { category: "philosophy", text: `Learn from those who disagree with you.` },
  {
    category: "philosophy",
    text: `Say no if you're genuinely not ready. It's okay to admit you need more time.\nPresent the way you want to be perceived. Think how you dress, what you post on social media etc.`,
  },
  {
    category: "philosophy",
    text: `The happiness of your life depends upon the quality of your thoughts.`,
    source: "Marcus Aurelius",
  },
  {
    category: "philosophy",
    text: `Procrastination isn't laziness. You don't put tasks off to avoid work. You do it to avoid unpleasant emotions— Self-doubt, boredom, confusion, frustration. Sometimes it's the one you fear.`,
  },
  { category: "philosophy", text: `The biggest mistake everyone makes. NEVER attach your upbringing to your identity.` },
  {
    category: "philosophy",
    text: `Your success in life depends on your ability to make good decisions. Your happiness depends on your ability to not care about the outcomes.`,
  },
  { category: "philosophy", text: `For your peace of mind, do not try to understand everything.` },
  {
    category: "philosophy",
    text: `The degree to which a person can grow is directly proportional to the amount of truth he can accept about himself without running away.`,
    source: "Leland Val Van De Wall",
  },
  {
    category: "philosophy",
    text: `There are people who are genuinely born in such terrible conditions that they actually have little to no chance of making it out. But if you live in the US, have a Macbook, and Internet, you're not one of these people.`,
  },
  {
    category: "philosophy",
    text: `Don't follow crowds. Follow the innate feelings inside of you. Do what you feel not what you think. Thoughts have been placed in our heads to make everyone assimilate. Follow what you feel.`,
    source: "Kanye West",
  },
  {
    category: "philosophy",
    text: `When you first wake up don't hop right on the phone or the internet or even speak to anyone for even up to an hour if possible. Just be still and enjoy your own imagination. It's better than any movie.`,
    source: "Kanye West",
  },
  { category: "philosophy", text: `The secret of life is to waste time in ways you like.` },
  {
    category: "philosophy",
    text: `Remembering that I'll be dead soon is the most important tool I've ever encountered to help me make the big choices in life… Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. You are already naked.`,
    source: "Steve Jobs",
  },

  // --------------------------------------------------------------- dream
  { category: "dream", text: `Your 9-5 isn't killing your dreams. Wasting your 5-9 is.` },
  {
    category: "dream",
    text: `Someone just said, "What a blessing it is to be tired in the pursuit of a challenge of your own choosing" and honestly that just rewired my brain.`,
  },
  { category: "dream", text: `Thug that shit out. Dont tell nobody what you going thru they dont really gaf` },
  { category: "dream", text: `YOUR LACK OF URGENCY IS DESTROYING YOUR POTENTIAL .` },
  {
    category: "dream",
    text: `If you want to achieve a goal, you'll either have to accept boredom or pain. And the bigger the goal, the more of both you'll get.`,
  },
  { category: "dream", text: `Money loves systems. Wealth loves automation. Poverty loves hustle.` },
  {
    category: "dream",
    text: `30 minutes before you go to sleep and 30 minutes after you wake up, your brain is programmable. I would study difficult things, read books with information I never want to forget, I don't touch my phone. I still read every morning.`,
  },
  { category: "dream", text: `i need to get rich immediately so i can explore shit like this` },
  { category: "dream", text: `How to stay poor: Keep starting new things rather than getting good at one thing.` },
  {
    category: "dream",
    text: `A job is work you do to survive, but often unpleasant. A career is work you tolerate for the eventual promise of more status and money. A calling is work you discover and can't pull yourself away from.`,
  },
  { category: "dream", text: `He who works all day has no time to make money.`, source: "John D. Rockefeller" },
  { category: "dream", text: `Until it's done, keep your mouth shut. That is the law.` },
  { category: "dream", text: `reminder: don't spend another year doing the same shit.` },
  {
    category: "dream",
    text: `There's a million ways to make a million dollars. If you lined up a thousand millionaires, The common characteristics you'd find are: Problem solving ability… AND relentlessness.`,
  },
  { category: "dream", text: `Unpopular opinion: Building an audience matters more than building a product` },
  { category: "dream", text: `You're allowed to be happy before you hit your goal, just not satisfied.` },
  { category: "dream", text: `Don't you ever in your motherfucking life dim your light for nobody` },
  {
    category: "dream",
    text: `Keep working on whatever you're working on every day. It might take months... It might take years... Just know that the bubble WILL eventually pop.`,
  },
  { category: "dream", text: `never forget the lifestyle you promised to yourself.` },
  {
    category: "dream",
    text: `nobody is more stressed than a person who has a lot of interest or passions and is still confused about their career`,
  },
  { category: "dream", text: `Set goals. Stay quiet. Achieve them. Stay quiet. Set bigger goals. Stay quiet. Achieve them. Stay quiet.` },
  { category: "dream", text: `Who else just knows they're destined to be a millionaire?` },
  {
    category: "dream",
    text: `You know the best way to stop depression? Work your ass off. You don't have time. You want to work so hard you don't have time for depression.`,
    source: "Donald Trump",
  },
  { category: "dream", text: `Any job is better than no job. It's great for your self esteem.` },
  { category: "dream", text: `Who you know > What you know. Network beats money in the bank every time.` },
  { category: "dream", text: `Give yourself permission to make more mistakes. Most of my success came from my failures.` },
  { category: "dream", text: `To get rich, you have to know when to seize the day. To stay rich, you have to know when to walk away.` },
  { category: "dream", text: `Stay loyal to your creativity because it is a gift.` },
  {
    category: "dream",
    text: `No matter how many mistakes you make or how slow you progress, you are still way ahead of everyone who isn't trying.`,
    source: "Tony Robbins",
  },
  { category: "dream", text: `Delusional optimism is the only way out.` },
  { category: "dream", text: `This is your last year being broke.` },
  { category: "dream", text: `It's always harder, takes longer, and costs more than you think it will.` },
  {
    category: "dream",
    text: `Best advice I've gotten in a while: Decide what kind of life you actually want. And then say no to everything that isn't that.`,
  },
  {
    category: "dream",
    text: `You have the best ideas. Other people's opinions are usually more distractive than informative. Follow your own vision. Base your actions on love.`,
    source: "Kanye West",
  },
  {
    category: "dream",
    text: `Mediocrity doesn't just happen. It's chosen over time through small choices day by day.`,
    source: "Todd Henry",
  },
  {
    category: "dream",
    text: `AI isn't going to replace you, a generalist with no ego spending $1000 on AI tools is going to replace 10 of you.`,
  },
  { category: "dream", text: `Generational wealth starts with one risk taker.` },
  { category: "dream", text: `As an avid job quitter, I'm telling yall right now: this is NOT a quitting economy.` },
  { category: "dream", text: `Success. 5% IQ. 5% Creativity. 45% Consistency. 45% Avoiding distractions.` },
  { category: "dream", text: `Get out of your head. You already know enough. Execute.` },
  { category: "dream", text: `You can't lose bro. You are the last hope of your parents. You have to win.` },
  { category: "dream", text: `Sheep need to be feed with information. Wolves hunt for it.` },
  {
    category: "dream",
    text: `Procrastinate procrastination. "I'll procrastine tomorrow." You'd be surprised how easily you can trick your brain into taking action.`,
  },
  {
    category: "dream",
    text: `There are only 2 ways to fail. (1) Being too arrogant to listen to people who already got what you want. (2) Being too lazy to do what it takes. If you stay humble & hard working you're destined to win.`,
  },
  {
    category: "dream",
    text: `You must always be prepared to place a bet on yourself, on your future, by heading in a direction that others seem to fear.`,
  },
  { category: "dream", text: `If opportunity doesn't knock, get up and build the damn door.` },
  { category: "dream", text: `The most addictive drug is momentum. Start small. Build daily. Watch it compound.` },
  { category: "dream", text: `Remember, you can do anything you set your mind to. Never stop believing in yourself.` },
  {
    category: "dream",
    text: `The difference between a hobby and a business isn't passion—it's whether people open their wallets. Validate with cash, not compliments.`,
  },
  { category: "dream", text: `The most powerful mindset you can adopt: "I'll start now and figure it out as I go."` },

  // --------------------------------------------------------- relationship
  {
    category: "relationship",
    text: `It was a privilege to love you, and it was a privilege to let you go. Both helped shape me into the person I have become.`,
    poetic: true,
  },
  { category: "relationship", text: `detach. let it end. accept the situation. move on.` },
  { category: "relationship", text: `My favorite love language is trying, actually… Just. Trying.` },
  { category: "relationship", text: `Don't allow someone to treat you poorly just because you love them.` },
  {
    category: "relationship",
    text: `as much as I desire to be in love again, I think about how calm my life is when it's just me`,
  },
  {
    category: "relationship",
    text: `When a girl is done with you, she shows no emotion, just facts. Cold professionalism where warmth used to be… You lost her before she ever spoke like that.`,
  },
  { category: "relationship", text: `You disrespect yourself when you rekindle a relationship that humiliated you.` },
  { category: "relationship", text: `Who you marry will have a bigger impact on your life than what you do for a living.` },
  {
    category: "relationship",
    text: `There's a Turkish saying—"If you truly love someone, you love them twice." The first time, it's all about attraction—their smile, voice, presence. But slowly, the curtain lifts… That's the love of understanding. The kind that stays. The kind that grows.`,
    poetic: true,
  },
  { category: "relationship", text: `Women leave when they're unhappy. Men leave when they disrespected and unappreciated.` },
  { category: "relationship", text: `Without money, only mother can love you. Agree?` },
  { category: "relationship", text: `Even if I see you again, I will never see you again`, source: "Margaret Atwood" },
  { category: "relationship", text: `A real man shows love through actions, not just words. because if he wanted, he would.` },
  {
    category: "relationship",
    text: `Lots of forgiveness for mess ups. Zero for dishonesty. The first shows a lack of competence. The second proves a lack of character.`,
  },
  {
    category: "relationship",
    text: `Respect your elders but don't follow their advice blindly. Sometimes it's right. Other times it's wrong. Often they didn't follow it themselves.`,
  },
  {
    category: "relationship",
    text: `Marry the one who'd shovel shit with you in the dark. A person like that is rarer than treasure you're looking to find.`,
  },
  { category: "relationship", text: `Before Allah gives you the right person, Allah will turn you into the right person.` },
  { category: "relationship", text: `honestly if you allow your parents, they'll control you forever.` },
  {
    category: "relationship",
    text: `PLEASE give yourself the chance to meet someone new instead of going back to a person from your past who didn't value you when they had you`,
  },
  {
    category: "relationship",
    text: `DO NOT DATE WHILE:\n- You're broke,\n- In terrible shape,\n- Your life is chaotic.\nFirst, get your life in order man.`,
  },
  { category: "relationship", text: `too much availability kills your VALUE.` },
  {
    category: "relationship",
    text: `At 18, women are desired for their beauty. At 28, men are valued for their status. The climb takes longer, but the reward is greater.`,
  },
  { category: "relationship", text: `A woman's life start at 18 a man's life start at 28. Few will understand.` },
  {
    category: "relationship",
    text: `Advice for men.\nChoosing a good mother for your kids is more important than choosing a beautiful wife for yourself.`,
  },
  {
    category: "relationship",
    text: `no longer interested in romantic love, it's silly and disadvantages women interested in strategic alliances - merge bloodlines, join clans, and build an empire. the only thing that matters is loyalty, consistency, and shared vision.`,
  },
  {
    category: "relationship",
    text: `Some women respect power, its a fact of life, also it helps that he's rich and handsome. (Not an excuse or endorsement of his behavior, just a observation.)`,
  },
  {
    category: "relationship",
    text: `You cannot debate with someone who lowkey doesn't like you, they are committed to misunderstanding you`,
  },
  {
    category: "relationship",
    text: `call me old school, but everyone should NOT be allowed in your house. and I also believe everyone should not know where you live.`,
  },
  {
    category: "relationship",
    text: `No matter how much you invest in her. If she's attracted to someone else, She will never appreciate your efforts. Women are loyal to their feelings, not your sacrifices.`,
  },
  {
    category: "relationship",
    text: `Weak men get abused, shy men get ignored, nice men get used, patient men get exploited, soft men get pushed around, and ruthless men get respected. The choice is yours.`,
  },
  {
    category: "relationship",
    text: `Before you enter a marriage, discuss: bills, career, religion, finance, dream home, political views, parenting style, family influence, childhood traumas, partner expectations. Love alone is not enough.`,
  },
  { category: "relationship", text: `If u having a bad day DONT take it out on me because i'll make it a terrible day` },
  { category: "relationship", text: `Chase you? I don't even go to work on time` },
  { category: "relationship", text: `Avoid people who respect only rich people.` },
  { category: "relationship", text: `Secret hint: Compliment people behind their back. Do it often. Thank me later.` },
  { category: "relationship", text: `Sadly, most of the enemies you have are the people you once helped in life.` },
  { category: "relationship", text: `If your parents are not rich, but you got a good education, be grateful for their sacrifices.` },
  { category: "relationship", text: `Remember who checks on you when you go quiet. Those are your people.` },
  { category: "relationship", text: `Don't tell them everything Even when you trust your close friends and family.` },
  { category: "relationship", text: `Normalize forgiving people in silence and never talk to them again.` },
];

export function quotesByCategory(category: QuoteCategory): Quote[] {
  return QUOTES.filter((q) => q.category === category);
}
