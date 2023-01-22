# how to use css in python_ flask
# flask render_template example
 
import os
from flask import Flask, jsonify, render_template, request
import hydrus_api
 
# WSGI Application
# Provide template folder name
# The default folder name should be "templates" else need to mention custom folder name
app = Flask(__name__)
app._static_folder = os.path.abspath("templates/static/")
 
# @app.route('/')
# def welcome():
#     return "This is the home page of Flask Application"

# @app.route('/searchFiles', methods=['POST'])
# def searchFiles():
#     data = request.json
#     CLIENT = hydrus_api.Client(data["access_key"], data["api_url"]);
#     #assuming we have the right perms
#     for search in data["searches"]:
#         search = CLIENT.clean_tags(search);
#         search = CLIENT.search_files(search);
#         search = CLIENT.get_file_metadata(file_ids=search);
#     return jsonify({"files": data["searches"]})
 
@app.route('/')
def index():
    return render_template('./indexv2.html')
 
if __name__=='__main__':
    app.run(host="0.0.0.0", debug = True, port=3000)