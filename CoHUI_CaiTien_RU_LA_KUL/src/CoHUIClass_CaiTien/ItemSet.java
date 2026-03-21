package CoHUIClass_CaiTien;

import java.util.List;

import CoHUIClass_CaiTien.ItemSet;

public class ItemSet {
	public int [] itemset; 
	public double utility = 0; 
	public float kulc=0f;
	public int[] getItems() {
		return itemset;
	}
	public ItemSet(){
		itemset = new int[]{};
	}
	
	public ItemSet(int item){
		itemset = new int[]{item};
	}

	public ItemSet(int [] items){
		this.itemset = items;
	}
	
	public ItemSet(List<Integer> itemset, double utility, float kulc){
		this.itemset = new int[itemset.size()];
	    int i = 0;
	    for (int item : itemset) { 
	    	this.itemset[i++] = item;
	    }
	    this.utility = utility;
	    this.kulc=kulc;
	}
	
	public ItemSet(int[] itemset, double utility, float kulc){
		this.itemset = itemset;
	    this.utility = utility;
	    this.kulc=kulc;
	}
	
	public double getUtility(){
		return utility;
	}
	
	public int size() {
		return itemset.length;
	}

	public int get(int position) {
		return itemset[position];
	}

	public void setUtility(double utility) {
		this.utility = utility;
	}

	public ItemSet cloneItemSetMinusOneItem(int itemToRemove) {
		// create the new itemset
		int[] newItemset = new int[itemset.length -1];
		int i=0;
		// for each item in this itemset
		for(int j =0; j < itemset.length; j++){
			// copy the item except if it is the item that should be excluded
			if(itemset[j] != itemToRemove){
				newItemset[i++] = itemset[j];
			}
		}
		return new ItemSet(newItemset); // return the copy
	}
	
	public String toString(){
		StringBuffer r = new StringBuffer();
		for(int i=0; i< size(); i++){
			r.append(get(i));
			r.append(' ');
		}
		return r.toString().trim(); // return the tring
	}
}
