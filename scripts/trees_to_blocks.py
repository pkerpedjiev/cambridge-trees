#!/usr/bin/python

import collections as col
import json
import shapely.geometry as sg
import slugid
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="""
    
    python trees_to_blocks.py blocks.json trees.json

    Calculate the most common tree type on each block.
""")

    parser.add_argument('trees')
    parser.add_argument('blocks')
    #parser.add_argument('argument', nargs=1)
    #parser.add_argument('-o', '--options', default='yo',
    #					 help="Some option", type='str')
    #parser.add_argument('-u', '--useless', action='store_true', 
    #					 help='Another useless option')

    args = parser.parse_args()

    blocks = json.load(open(args.blocks, 'r'))
    trees = json.load(open(args.trees, 'r'))

    block_tree_dict = col.defaultdict(lambda: col.defaultdict(int))
    block_dict = dict()

    for block in blocks['features']:
        uid = slugid.nice()
        block_dict[uid] = {
                    'uid': uid,
                    'block': block,
                    'polygon': sg.shape(block['geometry']),
                    'trees': col.defaultdict(int)
                }
    
    for e,tree in enumerate(trees['features']):
        if e % 1000 == 0:
            print e
        found = False 
        point = sg.Point(tree['geometry']['coordinates'])
        if tree['properties']['species'] is None:
            continue

        for uid in block_dict:
            polygon = block_dict[uid]['polygon']
            if polygon.contains(point):
                found = True
                block_dict[uid]['trees'][tree['properties']['species'].split(',')[0]] += 1
                break
        #print "tree:", tree

    for uid in block_dict:
        sorted_trees = sorted(block_dict[uid]['trees'].items(), key=lambda x: -x[1])

        if len(sorted_trees) > 0:
            total_trees = sum([st[1] for st in sorted_trees])
            block_dict[uid]['block']['properties']['most_common_tree_name'] = sorted_trees[0][0]
            block_dict[uid]['block']['properties']['total_tree_count'] = sum([st[1] for st in sorted_trees])
            print sorted_trees[0], total_trees
        else:
            block_dict[uid]['block']['properties']['most_common_tree_name'] = 'None'
            block_dict[uid]['block']['properties']['total_tree_count'] = 0
            print "No Trees"

    json.dump(blocks, open('block_trees.json', 'w'), indent=2)

if __name__ == '__main__':
    main()


