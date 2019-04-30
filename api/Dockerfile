FROM python:3.7.3

ADD . /api
WORKDIR /api
RUN pip install -r requirements.txt

ENTRYPOINT ["python"]
CMD ["app.py"]