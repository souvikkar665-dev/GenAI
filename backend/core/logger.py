"""Safe log helpers; avoid logging request bodies, credentials, or raw business data."""
import logging

def get_logger(name):
    return logging.getLogger(name)
