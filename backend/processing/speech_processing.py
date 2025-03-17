import os
import re
import time
import spacy
import string
from rapidfuzz import fuzz
from word2number import w2n
from utils import DatabaseUtil 

def get_data(subtest_name):
    db_util = DatabaseUtil()
    try:
        db_util.SessionFactory()
        print("Database connection is active.")
    except Exception as e:
        print(f"Failed to establish connection: {e}")

    df = db_util.extract_data(subtest_name)
    return df

def get_naming_score(expected_responses, actual_responses, threshold=85):
    scores = [0,0,0]
    total_score = 0

    for i in range(3):
        # print(expected_responses[i])
        # print(actual_responses[i])
        match_score = fuzz.ratio(expected_responses[i].lower(), actual_responses[i].lower())
        if match_score > threshold:
            scores[i] = 1
            total_score = total_score + 1
    return actual_responses, scores, total_score


def get_memory_score(expected_responses, actual_responses, threshold=85):
    """
    Processes memory test trials, transcribes responses, and stores results.
    - expected_responses: ['Face', 'Velvet', 'Daisy', 'Red', 'Church'].
    - actual_responses: [['Face', 'Velvet', 'Daisy', 'Red', 'Church'],['Face', 'Velvet', 'Daisy', 'Red', 'Church']].
    """
    scores = [[0,0,0,0,0], [0,0,0,0,0]]

    for trail in range(2):
        trail_response = actual_responses[trail]
        for word_idx in range(5):
            word_spoken = trail_response[word_idx].lower()
            word_expected = expected_responses[word_idx].lower()
            match_score = fuzz.ratio(word_spoken, word_expected)
            if match_score > threshold:
                scores[trail][word_idx] = 1

    return actual_responses, scores, 0

def get_attention_fs_score(expected_responses, actual_responses, threshold=85):
    return actual_responses, [0,0,0,0,0], 0

def get_attention_bs_score(expected_responses, actual_responses, threshold=85):
    return actual_responses, [0,0,0,0,0], 0

def get_attention_ss_score(expected_responses, actual_responses, threshold=85):
    return actual_responses, [0,0,0,0,0], 0

def get_sentence_repetiion_score(expected_responses, actual_responses, threshold=85):
    total_score = 0
    scores = [0,0]
    for i in range(2):

        # print(expected_responses[i])
        exptected_sentence = expected_responses[i][0].lower()
        actual_sentence = actual_responses[i][0].lower()
        similarity = fuzz.ratio(exptected_sentence, actual_sentence)
        if similarity>threshold:
            scores[i] = 1
            total_score = total_score + 1

    return actual_responses, scores, total_score


def get_verbal_fluency_score(expected_responses, actual_responses, nlp, threshold=85):
    
    target_letter = expected_responses[0].lower()
    spoken_words = actual_responses[0][0]
    doc = nlp(spoken_words.lower())
    valid_words = []
    seen_roots = set()
    total_score = 0
    score = [0]



    for token in doc:
        word = token.text.translate(str.maketrans('', '', string.punctuation))

        # Ensure word starts with the target letter
        if not word.startswith(target_letter):
            continue

        # Exclude numbers (convert words like "four" → 4)
        try:
            num_value = w2n.word_to_num(word)
            continue  # Skip if it's a number
        except ValueError:
            pass  # Not a number, continue processing

        # Exclude proper nouns (e.g., "Boston", "Bob")
        if token.pos_ == "PROPN":
            continue

        # Get lemma (base form) of word
        lemma = token.lemma_

        # Ensure unique root words
        if lemma not in seen_roots:
            seen_roots.add(lemma)
            valid_words.append(lemma)

    if len(valid_words)>=11:
        score[0] = 11
        total_score = 1


    return valid_words, score, total_score


def get_orientation_score(expected_responses, actual_responses, threshold=85):
    total_score = 0
    score = [0,0,0]
    for i in range(3):
        expected = expected_responses[i].lower()
        actual = actual_responses[i].lower()
        similarity = fuzz.ratio(expected, actual)
        if similarity > threshold:
            score[i] = 2
            total_score += 2

    return actual_responses, score, total_score




if __name__ == "__main__":
    
    db_util = DatabaseUtil()
    try:
        db_util.SessionFactory()
        print("Database connection is active.")
    except Exception as e:
        print(f"Failed to establish connection: {e}")



    # calculatate and store score for naming test
    df = db_util.extract_data("naming")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_naming_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int

    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)


    #######################################################################################################################
    # calculatate and store score for Memory test
    df = db_util.extract_data("memory")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_memory_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [[int(num) for num in sublist] for sublist in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)

    
    #######################################################################################################################
    # calculatate and store score for attention forward span test
    df = db_util.extract_data("attention_fs")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_attention_fs_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score] # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)


    #######################################################################################################################
    # calculatate and store score for attention backward span test
    df = db_util.extract_data("attention_bs")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_attention_bs_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)



    #######################################################################################################################
    # calculatate and store score for serial 7 test
    df = db_util.extract_data("attention_ss")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_attention_ss_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)


    ########################################################################################################################
    # calculatate and store score for sentence repitition test
    df = db_util.extract_data("sentence_repetition")
    # print(df["expected_responses"].iloc[0])
    extracted_responses, score, aggregated_score = get_sentence_repetiion_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)


     ########################################################################################################################
    # calculatate and store score for verbal fluency test
    df = db_util.extract_data("verbal_fluency")
    # print(df["expected_responses"].iloc[0])
    nlp = spacy.load("en_core_web_lg")
    extracted_responses, score, aggregated_score = get_verbal_fluency_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0], nlp)

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)



     ########################################################################################################################
    # calculatate and store score for abstraction test
    df = db_util.extract_data("orientation", '6WSG3E_20250309')
    # print(df["expected_responses"].iloc[0])

    extracted_responses, score, aggregated_score = get_orientation_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0])

    # Convert numpy types to native Python types
    subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # print(score)
    score = [int(num) for num in score]  # Convert list elements to int
    aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # print(score, aggregated_score)
    db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)

     ########################################################################################################################
    # # calculatate and store score for abstraction test
    # df = db_util.extract_data("abstraction")
    # # print(df["expected_responses"].iloc[0])
    # nlp = spacy.load("en_core_web_lg")
    # extracted_responses, score, aggregated_score = get_abstraction_score(df["expected_responses"].iloc[0], df["actual_responses"].iloc[0], nlp)

    # # Convert numpy types to native Python types
    # subtest_id = int(df["subtest_id"].iloc[0])  # Convert numpy.int64 to int
    # # print(score)
    # score = [int(num) for num in score]  # Convert list elements to int
    # aggregated_score = int(aggregated_score)  # Convert numpy.int64 to int
    # # print(score, aggregated_score)
    # db_util.load_data(subtest_id, extracted_responses, score, aggregated_score)



    db_util.close_connection()
    print("Database connection closed successfully.")



    




