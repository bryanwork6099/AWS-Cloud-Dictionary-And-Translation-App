import json
import boto3
import urllib.request
import urllib.error
import urllib.parse
import os
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

# DynamoDB configuration
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def lambda_handler(event, context):

    try:
        method = event.get('requestContext', {}).get(
            'http', {}
        ).get('method', 'GET')

        if method == 'GET':

            params = event.get('queryStringParameters') or {}
            word = params.get('word')

            if not word or not word.strip():
                return response(400, {
                    'message': 'Please provide a word.'
                })

            return search_word(word.strip())

        elif method == 'POST':

            params = event.get('queryStringParameters') or {}
            user_id = params.get('userId', 'guest001')

            result = table.query(
                KeyConditionExpression=Key(
                    'userId'
                ).eq(user_id),
                ScanIndexForward=False,
                Limit=20
            )

            return response(200, {
                'history': result.get('Items', [])
            })

        else:
            return response(405, {
                'message': 'Method not allowed.'
            })

    except Exception as e:

        print('Error:', str(e))
        print('Exception type:', type(e).__name__)

        return response(500, {
            'message': 'Internal server error.'
        })


def search_word(word):

    url = (
        'https://api.dictionaryapi.dev/api/v2/entries/en/'
        + urllib.parse.quote(word)
    )

    try:

        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'CloudDictionaryApp/1.0',
                'Accept': 'application/json'
            }
        )

        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.loads(res.read().decode())

        if not data:
            return response(404, {
                'message': 'Word not found.'
            })

        entry = data[0]

        meanings = entry.get('meanings', [])

        result = {
            'word': entry.get('word', word),
            'phonetic': entry.get('phonetic', ''),
            'meanings': meanings
        }

        definitions = (
            meanings[0].get('definitions', [])
            if meanings else []
        )

        definition = (
            definitions[0].get('definition', '')
            if definitions else ''
        )

        table.put_item(
            Item={
                'userId': 'guest001',
                'searchedAt': datetime.now(
                    timezone.utc
                ).isoformat(),
                'word': result['word'],
                'definition': definition
            }
        )

        return response(200, result)

    except urllib.error.HTTPError as e:

        print('HTTP Error:', e.code)
        print('HTTP Reason:', e.reason)

        if e.code == 404:
            return response(404, {
                'message': 'Word not found.'
            })

        if e.code == 403:
            return response(502, {
                'message': 'Dictionary API access forbidden.'
            })

        return response(502, {
            'message': 'Dictionary API request failed.'
        })

    except urllib.error.URLError as e:

        print('URL Error:', str(e))

        return response(502, {
            'message': 'Dictionary service unavailable.'
        })

    except Exception as e:

        print('Search Error:', str(e))
        print('Exception type:', type(e).__name__)

        return response(500, {
            'message': 'Failed to process dictionary request.'
        })


def response(status_code, body):

    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body, default=str)
    }