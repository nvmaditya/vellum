import { buildBook, SAMPLE_ID } from "@/lib/reading/model";

export function sampleBook() {
  return buildBook({
    id: SAMPLE_ID,
    title: "The Night Market",
    author: "Included story",
    source: "sample",
    chapters: [
      {
        title: "The closed shutter",
        blocks: [
          {
            kind: "paragraph",
            text: "The lane was still wet from the afternoon rain. Lamps came on one by one, and the paper flags over the tea stall lifted, then settled. She had come for the blue book and found the stall closed.",
          },
          {
            kind: "paragraph",
            text: "A square of paper was pinned under the latch, the ink still dark enough to smudge. She shifted the bag on her shoulder and waited, as if the shutter might change its mind.",
          },
          { kind: "heading", text: "The note" },
          {
            kind: "paragraph",
            text: "She stopped at the closed shutter and read the note twice. Come back after dark. Bring the blue book. Nothing else. No name, no hour, no promise that anyone would be there to take it.",
          },
          {
            kind: "paragraph",
            text: "Behind her, someone tuned a string until it held. The sound went up the lane and came back thinner, caught under the awnings. She did not turn around. The note had not asked her to.",
          },
          {
            kind: "paragraph",
            text: "She put the note in the book and the book in her bag. The bag was heavier than paper should be. She told herself that was only the rain in the cloth, and then she told herself to stop telling stories before she had the next page.",
          },
          {
            kind: "paragraph",
            text: "At the tea stall a man rinsed cups and stacked them without looking up. Steam climbed into the damp air and vanished. She bought nothing. Buying something would have made her a person who was staying, and she was not sure yet.",
          },
          {
            kind: "paragraph",
            text: "The lane bent past a shutter painted with a fish, then a shutter with no paint at all. Water ticked from a pipe into a tin. Somewhere a radio tried to find a song and found only the shape of one.",
          },
          {
            kind: "paragraph",
            text: "She walked until the flags were behind her and the note was a small hard square against the book. After dark was not a time. It was a door. She would come back when the lamps were the only light left, and she would see who opened it.",
          },
        ],
      },
      {
        title: "What the note meant",
        blocks: [
          {
            kind: "paragraph",
            text: "The blue book was not blue all the way through. The cover had faded to the color of deep water in a shallow pan, and the corners had gone pale where hands had held it. It had been her uncle's, and before that she did not know.",
          },
          {
            kind: "paragraph",
            text: "Inside, the pages were ordinary. A travel diary with the place names crossed out and written again in a smaller hand. Recipes that called for fruit she could not buy. A map of a coast that did not match any coast she had stood on.",
          },
          { kind: "heading", text: "The crossed-out harbor" },
          {
            kind: "paragraph",
            text: "On the map, a harbor had been drawn twice. The first drawing was careful. The second was hurried, and it moved the pier a finger's width to the east. Between them, in pencil, someone had written: not this one.",
          },
          {
            kind: "paragraph",
            text: "She sat on the steps of the closed library and read that page until the light changed. People came up the steps and went away again when they saw the shut doors. A child asked if the library had moved. His father said libraries do not move, they only close.",
          },
          {
            kind: "paragraph",
            text: "She was not so sure. A book could close and still take you somewhere. The note had known the book by its color, which meant someone had seen it, or had been told about it, or had held it and given it back without saying so.",
          },
          {
            kind: "paragraph",
            text: "At the bottom of the map was a list of tides. Most of the numbers were neat. One of them had been circled so many times the paper was thin. She touched it and felt the dent on the other side. After dark, then. When the water was at that mark, if the coast was the right coast. If it was not, the note was only a note.",
          },
          {
            kind: "paragraph",
            text: "She closed the book before she could decide she was being foolish. Foolish was a comfortable room, and she had been living in it. The lane had offered her a less comfortable one. She stood up, brushed the step from her coat, and went to find supper she did not particularly want.",
          },
        ],
      },
      {
        title: "After dark",
        blocks: [
          {
            kind: "paragraph",
            text: "Dark came the way it always did in that season, a little earlier than she had bargained for. The lamps were already warmer than the sky. The paper flags had gone still. Even the string was quiet.",
          },
          {
            kind: "paragraph",
            text: "The shutter was up the width of a hand. Light lay on the wet stone in a narrow bar. She could smell tea, and something sweeter, like orange peel dried too long in a tin.",
          },
          { kind: "heading", text: "The open hand" },
          {
            kind: "paragraph",
            text: "She knocked once, which felt official, and then she simply said that she had brought the book. A woman opened the shutter the rest of the way. She was older than the note had sounded, if a note can sound like anything, and she looked at the bag before she looked at the face.",
          },
          {
            kind: "paragraph",
            text: "You read it, the woman said. It was not a question. She held out her hand, palm up, and waited the way people wait for a cup that is too full to pass quickly.",
          },
          {
            kind: "paragraph",
            text: "She took the book out and did not give it over at once. The circled tide was still in her head. Not this one was still in her head. If she handed the book across, she might be handing across the only copy of a coast that had been corrected by someone who cared.",
          },
          {
            kind: "paragraph",
            text: "The woman did not reach. She nodded at the note, which had found its way back to the top of the bag. Keep the paper, she said. The book can stay with you tonight. Come when you have decided whether the pier was moved to hide it, or to show it to the person who already knew where it was.",
          },
          {
            kind: "paragraph",
            text: "Then she lowered the shutter, not all the way, and the bar of light thinned to a thread. The lane smelled of rain again. She stood with the blue book against her coat and understood that reading it had been the first errand, and that the next one would not fit on a square of paper.",
          },
          {
            kind: "paragraph",
            text: "Behind her, the string found its note and held it. She walked toward the lamps. The book was heavy in the ordinary way. She did not open it again until she was home, and when she did, the circled number was still there, patient as a held breath.",
          },
        ],
      },
    ],
  });
}
