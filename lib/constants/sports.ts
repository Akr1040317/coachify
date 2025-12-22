export const SPORTS = [
  "Cricket",
  "Soccer",
  "Basketball",
  "Tennis",
  "Baseball",
  "American Football",
  "Swimming",
  "Track and Field",
  "Volleyball",
  "Golf",
  "Martial Arts",
  "Esports",
] as const;

export const SPORT_EMOJIS: Record<string, string> = {
  Cricket: "🏏",
  Soccer: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Baseball: "⚾",
  "American Football": "🏈",
  Swimming: "🏊",
  "Track and Field": "🏃",
  Volleyball: "🏐",
  Golf: "⛳",
  "Martial Arts": "🥋",
  Esports: "🎮",
};

export type Sport = typeof SPORTS[number];

export const SPORT_FOCUS_AREAS: Record<Sport, string[]> = {
  Cricket: [
    "Batting technique",
    "Power hitting",
    "Timing and footwork",
    "Spin batting",
    "Pace and swing batting",
    "Bowling pace and run-up",
    "Swing and seam",
    "Spin bowling",
    "Variation development",
    "Wicket-keeping",
    "Fielding and throwing",
    "Game awareness and strategy",
    "Fitness for cricket",
  ],
  Soccer: [
    "First touch",
    "Finishing",
    "Passing and vision",
    "Speed and agility",
    "Defending",
    "Goalkeeping",
    "Tactics",
  ],
  Basketball: [
    "Shooting form",
    "Ball handling",
    "Finishing at rim",
    "Defense",
    "Footwork",
    "IQ and spacing",
    "Athleticism",
  ],
  Tennis: [
    "Forehand",
    "Backhand",
    "Serve",
    "Return",
    "Footwork",
    "Match strategy",
    "Mental toughness",
  ],
  Baseball: [
    "Hitting mechanics",
    "Pitching mechanics",
    "Fielding",
    "Throwing",
    "Catching",
    "Speed and agility",
    "Game IQ",
  ],
  "American Football": [
    "QB skills",
    "WR route running",
    "RB vision",
    "OL technique",
    "DL technique",
    "LB reads",
    "DB coverage",
    "Special teams",
    "Strength and conditioning",
  ],
  Swimming: [
    "Freestyle",
    "Backstroke",
    "Breaststroke",
    "Butterfly",
    "Starts and turns",
    "Endurance",
    "Race strategy",
  ],
  "Track and Field": [
    "Sprints",
    "Middle distance",
    "Distance",
    "Hurdles",
    "Jumps",
    "Throws",
    "Strength and conditioning",
  ],
  Volleyball: [
    "Serving",
    "Passing",
    "Setting",
    "Hitting",
    "Blocking",
    "Defense",
    "Court positioning",
  ],
  Golf: [
    "Swing mechanics",
    "Short game",
    "Putting",
    "Course management",
    "Mental game",
    "Strength and mobility",
  ],
  "Martial Arts": [
    "Striking",
    "Footwork",
    "Grappling",
    "Conditioning",
    "Sparring strategy",
    "Competition prep",
  ],
  Esports: [
    "Aim mechanics",
    "Game sense",
    "Decision making",
    "Comms and teamwork",
    "VOD review",
    "Rank climbing plan",
  ],
};

export const SKILL_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Competitive",
] as const;

export type SkillLevel = typeof SKILL_LEVELS[number];

export const SKILL_LEVEL_DESCRIPTIONS: Record<string, string> = {
  Beginner: "New to the sport or have minimal experience. Learning basic fundamentals and rules.",
  Intermediate: "Have some experience and can perform basic skills consistently. Ready to refine technique and learn more advanced concepts.",
  Advanced: "Experienced player with solid fundamentals. Working on advanced techniques, strategy, and consistency at a higher level.",
  Competitive: "Competing at a high level (club teams, tournaments, leagues). Focused on performance optimization and competitive edge.",
};

export const STUDENT_GOALS = [
  "Make school team",
  "Make club team",
  "Improve technique fundamentals",
  "Increase performance consistency",
  "Recover from plateau",
  "Prepare for tryouts",
  "Prepare for tournaments",
  "Fitness and conditioning",
  "Mental game and confidence",
  "College recruiting path",
] as const;

export type StudentGoal = typeof STUDENT_GOALS[number];

