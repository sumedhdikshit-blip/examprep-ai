import re

def split_text_into_sentences(text: str) -> list[str]:
    """Split text into sentences using simple regex on punctuation marks followed by spaces."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]

def chunk_text(pages: list[tuple[int | None, str]], target_words: int = 500, max_words: int = 600) -> list[dict]:
    """
    Chunks extracted pages. Each page contains (page_number, text).
    We build chunks of approximately target_words to max_words.
    We try to keep boundaries at paragraphs, and split paragraphs into sentences if they are too long.
    Since page_number must be preserved per chunk, we process each page individually.
    
    Returns a list of dicts: [{'page_number': int|None, 'text': str}]
    """
    all_chunks = []

    for page_num, page_text in pages:
        if not page_text.strip():
            continue
            
        # Split page text into paragraphs
        # Try splitting by double newlines first, then fallback to single newlines
        paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]
        if len(paragraphs) <= 1:
            paragraphs = [p.strip() for p in page_text.split("\n") if p.strip()]

        current_chunk_paragraphs = []
        current_word_count = 0

        for paragraph in paragraphs:
            p_words = paragraph.split()
            p_word_count = len(p_words)

            # If adding this paragraph doesn't exceed max_words, add it to the current chunk
            if current_word_count + p_word_count <= max_words:
                current_chunk_paragraphs.append(paragraph)
                current_word_count += p_word_count
            else:
                # If we have accumulated paragraphs, finalize the current chunk first
                if current_chunk_paragraphs:
                    all_chunks.append({
                        "page_number": page_num,
                        "text": "\n\n".join(current_chunk_paragraphs)
                    })
                    current_chunk_paragraphs = []
                    current_word_count = 0

                # If the single paragraph itself is larger than max_words, split it by sentence.
                if p_word_count > max_words:
                    sentences = split_text_into_sentences(paragraph)
                    current_chunk_sentences = []
                    s_word_count = 0
                    
                    for sentence in sentences:
                        s_words = sentence.split()
                        s_len = len(s_words)
                        
                        if s_word_count + s_len <= max_words:
                            current_chunk_sentences.append(sentence)
                            s_word_count += s_len
                        else:
                            if current_chunk_sentences:
                                all_chunks.append({
                                    "page_number": page_num,
                                    "text": " ".join(current_chunk_sentences)
                                })
                            current_chunk_sentences = [sentence]
                            s_word_count = s_len
                            
                    if current_chunk_sentences:
                        all_chunks.append({
                            "page_number": page_num,
                            "text": " ".join(current_chunk_sentences)
                        })
                else:
                    # The paragraph fits in a new chunk by itself
                    current_chunk_paragraphs = [paragraph]
                    current_word_count = p_word_count

        # Flush any remaining paragraphs on the page
        if current_chunk_paragraphs:
            all_chunks.append({
                "page_number": page_num,
                "text": "\n\n".join(current_chunk_paragraphs)
            })

    # Return all generated chunks
    return all_chunks
