package CoHUIClass_CaiTien;

import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ItemSets {
	private final List<List<ItemSet>> levels = new ArrayList<List<ItemSet>>(); 
	private int itemsetsCount = 0;
	private String name;

	public ItemSets(String name) {
		this.name = name;
		levels.add(new ArrayList<ItemSet>()); // We create an empty level 0 by
												// default.
	}

	public void printItemsets() {
		System.out.println(" ------- " + name + " -------");
		int patternCount = 1;
		int levelCount = 0;
		for (List<ItemSet> level : levels) {
			System.out.println("  L" + levelCount + " ");
			for (ItemSet itemset : level) {
				Arrays.sort(itemset.getItems());
				System.out.print("  pattern " + patternCount + ": [" +itemset.toString()+"]");
				System.out.print(" Utility: "+ itemset.getUtility());
				System.out.print(" Kulc: "+ itemset.kulc);
				patternCount++;
				System.out.println(" ");
			}
			levelCount++;
		}
		System.out.println(" --------------------------------");
	}

	public void addItemset(ItemSet itemset, int k) {
		while (levels.size() <= k) {
			levels.add(new ArrayList<ItemSet>());
		}
		levels.get(k).add(itemset);
		itemsetsCount++;
	}

	public List<List<ItemSet>> getLevels() {
		return levels;
	}

	public int getItemsetsCount() {
		return itemsetsCount;
	}

	public void setName(String newName) {
		name = newName;
	}
	
	public void decreaseItemsetCount() {
		itemsetsCount--;
	}
	
	public void saveFile(String path){
		
		try
		{
		File f = new File(path);
	    FileWriter fw = new FileWriter(f);
		int patternCount = 1;
		int levelCount = 0;
		String result="";
		for (List<ItemSet> level : levels) {
			result+="  L" + levelCount + " "+"\n";
			for (ItemSet itemset : level) {
				Arrays.sort(itemset.getItems());
				result+="  pattern " + patternCount + ": [" +itemset.toString()+"] ";
				result+=" Utility: "+ itemset.getUtility()+" ";
				result+=" Kulc: "+ itemset.kulc+" "+"\n";
				patternCount++;
			}
			levelCount++;
		}
		fw.write(result);
		fw.close();
		}catch(Exception e){}
	}
}
