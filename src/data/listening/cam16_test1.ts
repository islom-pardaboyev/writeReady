import Audio from "../../data/listening/test1_part1.mp3";
const questions = [
  {
    section: 1,
    type: "notes",
    audio: Audio,
    title: "Children's Engineering Workshops",
    instructions: "Write ONE WORD AND/OR A NUMBER",
    groups: [
      {
        heading: "Tiny Engineers (ages 4–5)",
        items: [
          { number: 1, template: "Create a cover for an ___ so they can drop it from a height without breaking it.", answer: "egg" },
          { number: 2, template: "Take part in a competition to build the tallest ___.", answer: "tower" },
          { number: 3, template: "Make a ___ powered by a balloon.", answer: "car" },
        ],
      },
      {
        heading: "Junior Engineers (ages 6–8)",
        items: [
          { number: 4, template: "Build model cars, trucks and ___ and learn how to program them so they can move.", answer: "animals" },
          { number: 5, template: "Take part in a competition to build the longest ___ using card and wood.", answer: "bridge" },
          { number: 6, template: "Create a short ___ with special software.", answer: "movie/film" },
          { number: 7, template: "Build, ___ and program a humanoid robot.", answer: "decorate" },
        ],
      },
      {
        headingInfo: "Cost for a five-week block: £50",
        items: [
          { number: 8, template: "Held on ___ from 10 am to 11 am.", answer: "Wednesday" },
        ],
      },
      {
        heading: "Location",
        items: [
          { number: 9, template: "Building 10A, ___ Industrial Estate, Grasford.", answer: "Fradstone" },
          { number: 10, template: "Plenty of ___ is available.", answer: "parking" },
        ],
      },
    ],
  },
];

export default questions;