# from langchain.chains.conversational_retrieval.prompts import CONDENSE_QUESTION_PROMPT, QA_PROMPT
import openai

openai.api_key = "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"

assistant_prompt = """
    You are an AI interviewer.
    Use the following pieces of context to ask a question to the interviewee.
    Your question should be written in the English language and be less than 256 words. 
"""

def get_condensed_question(self, question, chat_history):
    # ex_chat_history = [("Who founded Gaia?", "The founder of Gaia is Nader al Salim")]
    inps = {'chat_history': chat_history, 'question': question}
    condensed_question = self.question_generator(inps)["text"]
    # print("generated question: ", condensed_question)
    # docs_and_scores = [(doc, euclidean_relevance_score(score)) for doc, score in search_output if euclidean_relevance_score(score)>=0.7]
    # doc_strings = [format_document(doc, document_prompt) for doc, score in docs_and_scores]
    # print("Condensed question: ", condensed_question)
    return condensed_question

def get_context(job_des, resume):
    context_prompt = f"Job Description: {job_des}\nResume: {resume}\n"
    return context_prompt
    
     

def run(context_prompt):
    # joined_doc_strings, condensed_prompt = self.get_final_context_and_question(question, chat_history)
    for output in openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": assistant_prompt},
                {"role": "user", "content": context_prompt},
                # {"role": "user", "content": QA_PROMPT.template + "\n Pieces of context: \n" + joined_doc_strings + "\n Question: \n " + condensed_prompt},
            ],
            stream=True,
            max_tokens=512,
            temperature=0.4
        ):
            if "content" in output["choices"][0]["delta"].keys():
                yield output["choices"][0]["delta"]["content"]


def get_context_data():
    with open("job_des.txt", "r") as file:
    # Read the entire content of the file and store it in the variable
        job_des = file.read()
    with open("CV.txt", "r") as file:
    # Read the entire content of the file and store it in the variable
        resume = file.read()
    return job_des, resume

def main():
    job_des, resume = get_context_data()
    context_prompt = get_context(job_des, resume)
    response = ""
    # Now you can work with the content stored in the file_content variable
    for token in run(context_prompt):
        # Append the token to the dictionary string
        response += token
    print(response)

if __name__=="__main__":
    main()