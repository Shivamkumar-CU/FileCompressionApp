#include <iostream>
#include <fstream>
#include <queue>
#include <map>
#include <vector>
#include <string>
using namespace std;

struct Node {
    unsigned char ch;
    int freq;
    Node* left;
    Node* right;

    Node(unsigned char c, int f)
        : ch(c), freq(f), left(nullptr), right(nullptr) {}
};

struct Compare {
    bool operator()(Node* a, Node* b) {
        if (a->freq != b->freq)
            return a->freq > b->freq;
        return a->ch > b->ch;
    }
};

map<unsigned char, int> getFrequency(const vector<unsigned char>& data) {
    map<unsigned char, int> freq;
    for (unsigned char c : data)
        freq[c]++;
    return freq;
}

Node* buildTree(map<unsigned char, int>& freq) {
    priority_queue<Node*, vector<Node*>, Compare> pq;

    for (auto& p : freq)
        pq.push(new Node(p.first, p.second));

    while (pq.size() > 1) {
        Node* left = pq.top();
        pq.pop();

        Node* right = pq.top();
        pq.pop();

        Node* parent = new Node(0, left->freq + right->freq);

        parent->left = left;
        parent->right = right;

        pq.push(parent);
    }

    return pq.top();
}

void generateCodes(Node* root,
                   string code,
                   map<unsigned char, string>& codes) {

    if (!root)
        return;

    if (!root->left && !root->right) {
        codes[root->ch] = code.empty() ? "0" : code;
        return;
    }

    generateCodes(root->left, code + "0", codes);
    generateCodes(root->right, code + "1", codes);
}

void compress(const string& inputFile,
              const string& outputFile) {

    ifstream in(inputFile, ios::binary);

    if (!in) {
        cerr << "Cannot open input file\n";
        exit(1);
    }

    vector<unsigned char> data(
        (istreambuf_iterator<char>(in)),
        istreambuf_iterator<char>());

    in.close();

    if (data.empty()) {
        cerr << "Empty file\n";
        exit(1);
    }

    auto freq = getFrequency(data);

    Node* root = buildTree(freq);

    map<unsigned char, string> codes;
    generateCodes(root, "", codes);

    string encoded;

    for (unsigned char c : data)
        encoded += codes[c];

    vector<unsigned char> packed;

    unsigned char currentByte = 0;
    int bitCount = 0;

    for (char bit : encoded) {

        currentByte <<= 1;

        if (bit == '1')
            currentByte |= 1;

        bitCount++;

        if (bitCount == 8) {
            packed.push_back(currentByte);
            currentByte = 0;
            bitCount = 0;
        }
    }

    if (bitCount > 0) {
        currentByte <<= (8 - bitCount);
        packed.push_back(currentByte);
    }

    ofstream out(outputFile, ios::binary);

    int mapSize = freq.size();

    out.write(reinterpret_cast<char*>(&mapSize),
              sizeof(int));

    for (auto& p : freq) {

        unsigned char c = p.first;
        int f = p.second;

        out.write(reinterpret_cast<char*>(&c),
                  sizeof(unsigned char));

        out.write(reinterpret_cast<char*>(&f),
                  sizeof(int));
    }

    int encLen = encoded.size();

    out.write(reinterpret_cast<char*>(&encLen),
              sizeof(int));

    out.write(reinterpret_cast<char*>(packed.data()),
              packed.size());

    out.close();
}

void decompress(const string& inputFile,
                const string& outputFile) {

    ifstream in(inputFile, ios::binary);

    if (!in) {
        cerr << "Cannot open compressed file\n";
        exit(1);
    }

    int mapSize;

    in.read(reinterpret_cast<char*>(&mapSize),
            sizeof(int));

    map<unsigned char, int> freq;

    for (int i = 0; i < mapSize; i++) {

        unsigned char c;
        int f;

        in.read(reinterpret_cast<char*>(&c),
                sizeof(unsigned char));

        in.read(reinterpret_cast<char*>(&f),
                sizeof(int));

        freq[c] = f;
    }

    Node* root = buildTree(freq);

    int encLen;

    in.read(reinterpret_cast<char*>(&encLen),
            sizeof(int));

    vector<unsigned char> packed(
        (istreambuf_iterator<char>(in)),
        istreambuf_iterator<char>());

    in.close();

    string encoded;

    for (unsigned char byte : packed) {

        for (int i = 7; i >= 0; i--) {

            encoded += ((byte >> i) & 1)
                ? '1'
                : '0';

            if ((int)encoded.size() == encLen)
                break;
        }

        if ((int)encoded.size() == encLen)
            break;
    }

    vector<unsigned char> decoded;

    Node* curr = root;

    for (char bit : encoded) {

        curr = (bit == '0')
                   ? curr->left
                   : curr->right;

        if (!curr->left && !curr->right) {
            decoded.push_back(curr->ch);
            curr = root;
        }
    }

    ofstream out(outputFile, ios::binary);

    out.write(
        reinterpret_cast<char*>(decoded.data()),
        decoded.size());

    out.close();
}

int main(int argc, char* argv[]) {

    if (argc != 4) {
        cerr << "Usage:\n";
        cerr << "./compressor compress input output\n";
        cerr << "./compressor decompress input output\n";
        return 1;
    }

    string mode = argv[1];
    string input = argv[2];
    string output = argv[3];

    if (mode == "compress")
        compress(input, output);
    else if (mode == "decompress")
        decompress(input, output);
    else {
        cerr << "Invalid mode\n";
        return 1;
    }

    return 0;
}