import { createStep } from '@mastra/core/workflows';
import { WorkflowDTO } from './schemas';

export const scheduleKeywordsStep = createStep({
  id: 'schedule-keywords',
  inputSchema: WorkflowDTO,
  outputSchema: WorkflowDTO,
  execute: async ({ inputData }) => {
    const { keywords } = inputData;

    const scheduledKeywords = keywords?.map((keyword, index) => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + index);

      return {
        ...keyword,
        scheduledDate,
      };
    });

    return {
      ...inputData,
      keywords: scheduledKeywords,
    };
  },
});

export default scheduleKeywordsStep;
