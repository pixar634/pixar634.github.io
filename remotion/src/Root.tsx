import { Composition, registerRoot } from "remotion";
import { loadNohemi } from "./loadNohemi";

loadNohemi();
import { ExplorePeek } from "./compositions/ExplorePeek";
import { HeroMorph } from "./compositions/HeroMorph";
import { ReelImport } from "./compositions/ReelImport";
import { GroupVote } from "./compositions/GroupVote";
import { ReturnClock } from "./compositions/ReturnClock";
import { AiScout } from "./compositions/AiScout";
import { Radar } from "./compositions/Radar";
import { Weather } from "./compositions/Weather";
import { Logistics } from "./compositions/Logistics";
import { CollectionsFriends } from "./compositions/CollectionsFriends";
import {
  LookMap, LookCard, HungerRail, HungerCount, PeopleVote, PeopleInvite,
} from "./compositions/Fragments";
import { ProUpgrade } from "./compositions/ProUpgrade";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ExplorePeek"
        component={ExplorePeek}
        durationInFrames={186}
        fps={30}
        width={390}
        height={844}
        defaultProps={{}}
      />
      <Composition
        id="HeroMorph"
        component={HeroMorph}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="ReelImport"
        component={ReelImport}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="GroupVote"
        component={GroupVote}
        durationInFrames={510}
        fps={30}
        width={390}
        height={844}
        defaultProps={{}}
      />
      <Composition
        id="ReturnClock"
        component={ReturnClock}
        durationInFrames={264}
        fps={30}
        width={390}
        height={844}
        defaultProps={{}}
      />
      <Composition
        id="AiScout"
        component={AiScout}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="Radar"
        component={Radar}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="Weather"
        component={Weather}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="Logistics"
        component={Logistics}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="CollectionsFriends"
        component={CollectionsFriends}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="ProUpgrade"
        component={ProUpgrade}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{}}
      />
      <Composition id="FragLookMap" component={LookMap} durationInFrames={150} fps={30} width={620} height={440} defaultProps={{}} />
      <Composition id="FragLookCard" component={LookCard} durationInFrames={150} fps={30} width={480} height={112} defaultProps={{}} />
      <Composition id="FragHungerRail" component={HungerRail} durationInFrames={180} fps={30} width={620} height={440} defaultProps={{}} />
      <Composition id="FragHungerCount" component={HungerCount} durationInFrames={180} fps={30} width={480} height={112} defaultProps={{}} />
      <Composition id="FragPeopleVote" component={PeopleVote} durationInFrames={165} fps={30} width={620} height={440} defaultProps={{}} />
      <Composition id="FragPeopleInvite" component={PeopleInvite} durationInFrames={165} fps={30} width={480} height={112} defaultProps={{}} />
    </>
  );
};

registerRoot(RemotionRoot);

export default RemotionRoot;
