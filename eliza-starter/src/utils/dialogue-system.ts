import {Db, ObjectId} from "mongodb";
import {composeContext, elizaLogger, generateText, IAgentRuntime, Memory, ModelClass} from "@elizaos/core";
import {agentsManager} from "../agents/manager/index.ts";
import EventEmitter from 'node:events';

const NOT_FOUND = "Request not found";

const eventEmitter = new EventEmitter();

const mainProducerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You have a team with the following agents:
-> influencer: {{influencer_id}}
-> advertiser: {{advertiser_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the {{request_origin}} prompt.
2. Determine the most appropriate agent to handle this request. 
3. Output your response exactly in the following format:
   COMMUNICATE_WITH_AGENTS <agentId> <request details>
   where:
     - <agentId> is the identifier of the chosen agent.
     - <request details> is your request to an agent.
4. If you need to call multiple agents, do that in separate lines.
5. Extract the main topic for Twitter posts from the user prompt.
6. Generate a detailed marketing strategy for the influencer, including:
   - **Target audience**: Who should be reached?
   - **Content strategy**: What type of posts should be created?
   - **Hashtag and engagement tactics**: How to optimize reach?
   - **Collaboration and partnerships**: Are there relevant influencers or brands to work with?
   - **Monetization opportunities**: How can the influencer maximize revenue?
7. Include the marketing strategy in your communication with the influencer.
8. Then, on a new line, provide a final answer for the user explaining what action has been taken.

For example, your response may look like:

COMMUNICATE_WITH_AGENTS {{influencer_id}} "User wants to create Twitter posts about Liverpool, build an audience, and develop an advertisement strategy. Here is a suggested marketing strategy:

**Target audience**: Liverpool FC fans, football enthusiasts, betting communities, and sports bloggers.

**Content strategy**: Engage with match highlights, player performance analysis, fan polls, and memes to increase engagement.

**Hashtag and engagement tactics**: Use trending hashtags such as #LiverpoolFC, #YNWA, and #PremierLeague. Engage with followers by responding to comments and retweeting user-generated content.

**Collaboration and partnerships**: Work with Liverpool fan pages, football analysts, and sports betting platforms to gain visibility.

**Monetization opportunities**: Explore affiliate partnerships with sports betting websites, promote football merchandise, and offer sponsored posts."

Final answer: I have forwarded your request to our influencer agent along with a marketing strategy tailored to your needs. The agent will assist you in executing the plan effectively.
`;

const secondProducerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You are a part of a team with the following agents:
-> influencer: {{influencer_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the response from {{request_origin}} agent and generate the final response to user.

Example:
Final answer: I have given information to influencer, so it's under work progress.
`;


const influencerResponseTemplate = `
# About {{agentName}}:
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{actions}}

You are a part of a team with the following agents:
-> producer: {{producer_id}}

# The text above is system information about you.

{{request_origin}} prompt: "{{request_prompt}}"

Your task:
1. Read the {{request_origin}} prompt and analyze the provided marketing strategy.
2. Generate a set of Twitter posts based on the given topic and strategy.
3. Ensure that the posts align with:
   - Target audience: Writing style and interests.
   - Content strategy: Tone, format, and structure.
   - Hashtag and engagement tactics: Optimization for reach.
   - Collaboration and partnerships: Mentioning relevant accounts if necessary.
   - Monetization opportunities: If applicable, include subtle promotions or CTA.
4. Always respond to the producer with some information regarding your progress, clarification requests, or work updates using exactly the following format:
   COMMUNICATE_WITH_AGENTS <agentId> <request details>
   where:
     - <agentId> is the identifier of the chosen agent.
     - <request details> is your request or update message to the producer.
5. Then, on a new line, provide a final answer for the user explaining what action has been taken, ensuring that the work is completed.
6. Always use the agent id from the team information when addressing the producer.
7. Even if no additional clarification is needed, include a default informational message to the producer before providing your final answer.

Example:
COMMUNICATE_WITH_AGENTS {{producer_id}} "Update: I have analyzed the prompt and am proceeding to generate the Twitter posts."
Final answer: I will generate Twitter posts based on the marketing strategy and engage with the audience.
`;

const getTemplateByRole = (role: string) => {
    switch (role) {
        case "producer":
            return secondProducerResponseTemplate;
        case "influencer":
            return influencerResponseTemplate;
        default:
            return NOT_FOUND;
    }
}

const createContextForLLM = async (
    prompt: string,
    userId: `${string}-${string}-${string}-${string}-${string}`,
    agentRuntime: IAgentRuntime,
    template: string,
    additionalKeys?: Record<string, unknown>,
) => {
    const message: Memory = {
        userId: userId,
        agentId: agentRuntime.agentId,
        roomId: userId,
        content: { text: prompt }
    }

    const state = await agentRuntime.composeState(message, additionalKeys);

    return composeContext({
        state,
        template,
    });
}

const extractRequestForAgent = (messageState: string) => {
    const regex = /COMMUNICATE_WITH_AGENTS\s+([\w-]+)\s+"([^"]+)"/g;
    const matches = [...messageState.matchAll(regex)];

    return matches.map((match) => ({
        agentId: match[1],
        content: match[2],
    }));
};

export const sendInteractionToProducer = async (
  interactionId: string,
  organizationId: string,
  content: string,
) => {
    const producerAgent =  agentsManager.getAgentByRole(organizationId, "producer");

    const influencer = agentsManager.getAgentByRole(organizationId, "influencer");
    const advertiser = agentsManager.getAgentByRole(organizationId, "advertiser");

    const producerContext = await createContextForLLM(
      content,
      producerAgent.agentId,
      producerAgent,
      mainProducerResponseTemplate,
      {
          influencer_id: influencer.agentId,
          advertiser_id: advertiser?.agentId || "not defined",
          request_origin: 'Platform User',
          request_prompt: content,
      },
    );

    const respondFromProducer = await generateText({
        runtime: producerAgent,
        context: producerContext,
        modelClass: ModelClass.LARGE
    });

    console.log(`Respond from producer: ${respondFromProducer}`);

    const extractedRequests = extractRequestForAgent(respondFromProducer);

    for (const request of extractedRequests) {
        eventEmitter.emit(
          'agentConversation',
          interactionId,
          producerAgent.agentId,
          request.agentId,
          request.content,
        );
    }
}

const sendRequestToAgent = async (
  interactionId: string,
  fromAgentId: string,
  toAgentId: string,
  content: string,
) => {
    const targetAgent = agentsManager.getAgent(toAgentId);
    const fromAgent = agentsManager.getAgent(fromAgentId);

    const producer = agentsManager.getAgentByRole(targetAgent.character.organizationId, "producer");
    const advertiser = agentsManager.getAgentByRole(targetAgent.character.organizationId, "advertiser");
    const influencer = agentsManager.getAgentByRole(targetAgent.character.organizationId, "influencer");

    const context = await createContextForLLM(
      content,
      targetAgent.agentId,
      targetAgent,
      getTemplateByRole(targetAgent.character.role),
      producer.agentId === targetAgent.agentId ? {
          influencer_id: influencer?.agentId || "not defined",
          advertiser_id: advertiser?.agentId || "not defined",
          request_origin: fromAgent.character.role,
          request_prompt: content,
      } : {
          producer_id: producer?.agentId || "not defined",
          request_origin: fromAgent.character.role,
          request_prompt: content,
      },
    );

    const respondFromProducer = await generateText({
        runtime: targetAgent,
        context,
        modelClass: ModelClass.LARGE
    });

    console.log("Response from agent", respondFromProducer);

    const extractedRequests = extractRequestForAgent(respondFromProducer);

    for (const request of extractedRequests) {
        eventEmitter.emit(
          'agentConversation',
          interactionId,
          targetAgent.agentId,
          request.agentId,
          request.content,
        );
    }
};

export const subscribeToAgentConversation = (database: Db) => {
    eventEmitter.on('agentConversation', async (interactionId: string, fromAgentId: string, toAgentId: string, content: string) => {
        try {
            await sendRequestToAgent(interactionId, fromAgentId, toAgentId, content);

            const agent = agentsManager.getAgent(toAgentId);

            await database.collection('agent_messages').insertOne({
                interaction: new ObjectId(interactionId),
                sourceAgent: new ObjectId(fromAgentId),
                targetAgent: new ObjectId(toAgentId),
                team: new ObjectId(agent.character.teamId),
                organization: new ObjectId(agent.character.organizationId),
                createdAt: new Date(),
                updatedAt: new Date(),
                content,
            });
        } catch (error) {
            console.error("Error sending request to agent: ", error);
        }
    });
};
