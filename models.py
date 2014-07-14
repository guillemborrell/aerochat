from google.appengine.ext import ndb

class ChatManager(ndb.Model):
    name = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)
    clients = ndb.StringProperty(repeated=True)
    private = ndb.BooleanProperty()
    active = ndb.BooleanProperty()
    owner = ndb.UserProperty()
    options = ndb.JsonProperty()

    @classmethod
    def query_public(cls,num):
        return cls.query(
            cls.active == True, cls.private == False).order(
                    -cls.date).fetch(num)

    @classmethod
    def query_user(cls,user,num):
        return cls.query(
            cls.active == True, cls.owner == user).order(
                    -cls.date).fetch(num)

    @classmethod
    def query_last(cls,num):
        return cls.query(cls.active == True).order(-cls.date).fetch(num)

    def num_clients(self):
        return len(self.clients)

    def add_client(self, client):
        client_list = self.clients
        client_list.append(client)
        self.put()

    def remove_client(self, client):
        client_list = self.clients
        while client in client_list: client_list.remove(client)
        self.put()


class Message(ndb.Model):
    date = ndb.DateTimeProperty(auto_now_add=True)
    author = ndb.StringProperty()
    client = ndb.StringProperty()
    text = ndb.StringProperty()

    @classmethod
    def query_last_from_chat(cls,num,chat_key):
        query = cls.query(ancestor=ndb.Key(urlsafe=chat_key))
        return query.order(-cls.date).fetch(10)


class Event(ndb.Model):
    date = ndb.DateTimeProperty(auto_now_add=True)
    kind = ndb.StringProperty()
    data = ndb.JsonProperty()