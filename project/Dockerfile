FROM python:3.7.3

ADD . /project
WORKDIR /project
RUN pip install -r requirements.txt

ENTRYPOINT ["python"]
CMD ["app.py"]