"""Amazon Bedrock boundary. No calls occur until AWS is attached and configured."""
class BedrockAdapter:
    def structure_decision(self, question):
        if not isinstance(question,str) or not question.strip():raise ValueError('A decision question is required.')
        raise NotImplementedError('Attach AWS credentials, IAM permissions, and an approved Bedrock model before enabling this adapter.')
    def explain_results(self, structured_results):
        if not isinstance(structured_results,dict):raise ValueError('Structured model results are required.')
        raise NotImplementedError('Explanation generation is not enabled; numerical values must remain sourced from model outputs.')
