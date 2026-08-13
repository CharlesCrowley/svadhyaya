export interface ChantTrack {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  duration: number;
  source: string;
}

export const chantTracks: ChantTrack[] = [
  {
    id: "introductory-mantras",
    number: 1,
    title: "Introductory Mantras",
    subtitle: "Opening invocations",
    duration: 146.68,
    source: "/media/01-introductory-mantras.mp3"
  },
  {
    id: "guru-paduka-panchakam",
    number: 2,
    title: "Śrī Guru Pādukā Pañcakam",
    subtitle: "Five verses to the Guru's sandals",
    duration: 171.62,
    source: "/media/02-shri-guru-paduka-panchakam.mp3"
  },
  {
    id: "guru-gita",
    number: 3,
    title: "Śrī Guru Gītā",
    subtitle: "The song of the Guru",
    duration: 2581,
    source: "/media/03-shri-guru-gita.mp3"
  },
  {
    id: "avadhuta-stotram",
    number: 4,
    title: "Śrī Avadhūta Stotram",
    subtitle: "Hymn to Bhagavan Nityānanda",
    duration: 352.44,
    source: "/media/04-shri-avadhuta-stotram.mp3"
  },
  {
    id: "jyota-se-jyota",
    number: 5,
    title: "Jyota se Jyota Jagao",
    subtitle: "Bhajan and closing verses",
    duration: 434.18,
    source: "/media/05-jyota-se-jyota-jagao.mp3"
  }
];
