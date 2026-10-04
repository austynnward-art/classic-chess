export const courses = {
  foundations: {
    id: "foundations",
    title: "Chess Fundamentals",
    category: "foundations",
    chapters: [
      { id: "fundamentals-1", title: "Board & Legal Moves", lessons: [
        { id:"fund-1", title:"Board & legal moves", description:"Start from the initial position and make a legal move.", fen:"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
        { id:"fund-2", title:"Checks & captures", description:"Practice identifying forcing moves.", fen:"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" }
      ]},
      { id: "fundamentals-2", title: "Tactics & Review", lessons: [
        { id:"fund-3", title:"Knight forks", description:"Learn the idea of attacking two targets.", fen:"r1bqkbnr/pppp1ppp/2n5/4p3/8/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 3" },
        { id:"fund-4", title:"Game review", description:"Use a candidate move before consulting the engine.", fen:"rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" }
      ]}
    ]
  },
  opening: {
    id: "opening", title:"Opening Basics", category:"opening",
    chapters:[{id:"opening-1",title:"Principles",lessons:[
      {id:"open-1",title:"Control the center",description:"Choose a move that contests central space.",fen:"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"},
      {id:"open-2",title:"Develop pieces",description:"Bring a minor piece toward the center.",fen:"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"},
      {id:"open-3",title:"King safety",description:"Build toward safe castling.",fen:"rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 2"}
    ]}]
  },
  engine: {
    id:"engine", title:"Stockfish Fundamentals", category:"engine",
    chapters:[{id:"engine-1",title:"Reading the Engine",lessons:[
      {id:"eng-1",title:"Evaluation",description:"Make your own candidate move before checking Stockfish.",fen:"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"},
      {id:"eng-2",title:"Candidate moves",description:"Compare your idea with the engine.",fen:"rnbqkbnr/pppppppp/8/8/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 1"},
      {id:"eng-3",title:"Best line",description:"Use the principal variation to study a position.",fen:"r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5"}
    ]}]
  }
};

export function allLessons() {
  return Object.values(courses).flatMap(course =>
    course.chapters.flatMap(chapter => chapter.lessons.map(lesson => ({...lesson, courseId:course.id, chapterId:chapter.id})))
  );
}
