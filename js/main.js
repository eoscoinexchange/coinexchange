var eosjs = '';
var eos = null;
var scatter = null;
var loginflag = 0;
var sellersel = '';
var sellerprice = '';
var curcointype = '';
var curcoindeal = 'all';
var g_curtpwallet = '';
var g_curtpwalletaddress = '';
var g_curliquideos = '';
var getcoinsflag = 0;
var getcoinsflagex = 0;
var network = {
	blockchain: 'eos',
	protocol: 'https',
	host: 'openapi.eos.ren',
	port: 443,
	chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};

function EosjsInit() {
	var eosConfig = {
		chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
		httpEndpoint: 'https://openapi.eos.ren',
		verbose: true
	}

	eosjs = Eos(eosConfig);
}

function gettpwalletlist() {
	if (tp.isConnected() == true) {
		$("#tpwalletlistdiv").show();
		tp.getWalletList('eos').then(data => {
			var accountcnt = data["wallets"]["eos"].length;
			var $accountlistid = $("#tpwalletlist");
			$accountlistid.empty();
			for (var i = 0; i <= accountcnt; i++) {
				var accountname = data["wallets"]["eos"][i]["name"];
				var address = data["wallets"]["eos"][i]["address"];
				$accountlistid.append(new Option(accountname, accountname+' '+address));
				if (i == 0) {
					g_curtpwallet = accountname;
					g_curtpwalletaddress = address;
					checkshishicai(g_curtpwallet);
				}
			}
		})
	}
}

function tpwalletlistchange(obj) {
	g_curtpwallet = $(obj).val().split(' ')[0];
	g_curtpwalletaddress = $(obj).val().split(' ')[1];
	checkshishicai(g_curtpwallet);
}

function getaccountinfo(accountname) {
	eosjs.getAccount(accountname, function (error, data) {
		if (error == null) {
			// var ram_quota = data["ram_quota"] / 1024.00;
			// ram_quota = ram_quota.toFixed(2);
			// var ram_usage = data["ram_usage"] / 1024.00;
			// ram_usage = ram_usage.toFixed(2);
			// var ram_per = (ram_usage / ram_quota) * 100;
			// ram_per = ram_per.toFixed(2);
			// var ram_text = ram_usage + "KB/" + ram_quota + "KB";

			// $("#raminfo").text("占用:" + ram_per + "%");
			$("#liquideos").text("余额:" + data["core_liquid_balance"]);
			g_curliquideos = data["core_liquid_balance"].split(' ')[0];
		} else {
			Dialog.init(error);
		}
	})
}

function formatDateTime(inputTime) {
	if (inputTime == 0) {
		return "未记录";
	}
	var date = new Date(inputTime);
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	m = m < 10 ? ('0' + m) : m;
	var d = date.getDate();
	d = d < 10 ? ('0' + d) : d;
	var h = date.getHours();
	h = h < 10 ? ('0' + h) : h;
	var minute = date.getMinutes();
	var second = date.getSeconds();
	minute = minute < 10 ? ('0' + minute) : minute;
	second = second < 10 ? ('0' + second) : second;
	return y + '/' + m + '/' + d + ' ' + h + ':' + minute + ':' + second;
};

function swapRow(i, k) {
	var tb = $("#sellertablebody").find("tr");

	$(tb).eq(k).insertBefore($(tb).eq(i));

	$(tb).eq(i).insertAfter($(tb).eq(k));

}

function SortTb(col, order) {

	var tb = $("#sellertablebody").find("tr");

	var total = tb.length;

	//外层循环，共要进行arr.length次求最大值操作

	for (var i = 0; i < total; i++)

	{

		//内层循环，找到第i大的元素，并将其和第i个元素交换

		for (var j = i; j < total; j++)

		{

			var v = $(tb).eq(i).find("td").eq(col).find("p").html().split(' ')[0];

			var v2 = $(tb).eq(j).find("td").eq(col).find("p").html().split(' ')[0];

			if (v > v2)

			{

				//交换两个元素的位置

				swapRow(i, j);

				tb = $("#sellertablebody").find("tr");

			}

		}

	}

	return;
}

function sellcoinchange() {
	$("#sellcoincntid").attr("placeholder", "请输入想出售或收回的" + $("#coinname").val().split(' ')[1] + "数量");

	eosjs.getTableRows(true, $("#coinname").val().split(' ')[0], $("#usernamea").html().split(' ')[0], "accounts", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt == 0) {
				console.log($("#coinname").val());
				$("#accounttoken").text("余额:0.0000 " + $("#coinname").val().split(' ')[1]);
			} else {
				for (var i = 0; i < cnt; i++) {
					var balance = data["rows"][i]["balance"];
					console.log("balance is " + balance.split(' ')[1]);
					if (balance.split(' ')[1] == $("#coinname").val().split(' ')[1]) {
						$("#accounttoken").text("余额:" + balance);
						break;
					}
				}

				if (i == cnt) {
					$("#accounttoken").text("余额:0.0000 " + $("#coinname").val().split(' ')[1]);
				}
			}
		} else {
			console.log(error);
		}
	})
}

function transfersell() {
	try {
		var priceint = accMul($("#coinpriceid").val(), 1000000);
		console.log("priceint is " + priceint);

		if (tp.isConnected() == true && 0) {
			tp.eosTokenTransfer({
				from: $("#usernamea").html().split(' ')[0],
				to: 'cointotheeos',
				amount: $("#sellcoincntid").val() + '.0000',
				tokenName: $("#coinname").val().split(' ')[1],
				precision: 4,
				contract: $("#coinname").val().split(' ')[0],
				memo: priceint,
			}).then(function (data) {
				//Dialog.init('Success!');
				sellcoinchange();
			}).catch(function (err) {
				Dialog.init(JSON.stringify(err));
			});
		} else {
			scatter.getIdentity({
				accounts: [network]
			}).then(function (identity) {
				var account = identity.accounts[0];
				var options = {
					authorization: account.name + '@' + account.authority,
					broadcast: true,
					sign: true
				};

				eos.contract($("#coinname").val().split(' ')[0], options).then(contract => {
					contract.transfer(account.name, "cointotheeos", $("#sellcoincntid").val() + '.0000 ' + $("#coinname").val().split(' ')[1], priceint, options).then(function (tx) {
						Dialog.init('Success!');
						sellcoinchange();
						//getaccountinfo(account.name);
					}).catch(function (e) {
						console.log(e);
						e = JSON.parse(e);
						if (e.error.details[0].message != "Invalid packed transaction") {
							Dialog.init(e.error.details[0].message);
						}
					});
				});

			})
		}
	} catch (e) {
		Dialog.init(e);
	}
}

function transfergetback(quant) {
	try {

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};
			eos.contract('cointotheeos', options).then(contract => {
				contract.takeback(account.name, quant, options).then(function (tx) {
					Dialog.init('Success!');
					sellcoinchange();
					getuserselllist();
					//getaccountinfo(account.name);
				}).catch(function (e) {
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})

	} catch (e) {
		Dialog.init(e);
	}
}

function transferbuy() {
	try {
		var cointoeos = accMul($("#buycoincntid").val(), sellerprice);
		if (cointoeos.toFixed(4) != cointoeos) {
			if (cointoeos.toFixed(4) < cointoeos) {
				cointoeos = cointoeos + 0.0001;
			}
		}

		console.log("transferbuy cointoeos is " + cointoeos.toFixed(4));

		if (tp.isConnected() == true && 0) {
			tp.eosTokenTransfer({
				from: $("#usernamea").html().split(' ')[0],
				to: 'cointotheeos',
				amount: cointoeos.toFixed(4),
				tokenName: 'EOS',
				precision: 4,
				contract: 'eosio.token',
				memo: sellersel,
			}).then(function (data) {
				//Dialog.init('Success!');
				getaccountinfo($("#usernamea").html().split(' ')[0]);
				sellcoinchange();
			}).catch(function (err) {
				Dialog.init(JSON.stringify(err));
			});
		} else {
			scatter.getIdentity({
				accounts: [network]
			}).then(function (identity) {
				var account = identity.accounts[0];
				var options = {
					authorization: account.name + '@' + account.authority,
					broadcast: true,
					sign: true
				};

				eos.contract('eosio.token', options).then(contract => {
					contract.transfer(account.name, "cointotheeos", cointoeos.toFixed(4) + ' EOS', sellersel + " " + curcointype, options).then(function (tx) {
						Dialog.init('Success!');
						getaccountinfo(account.name);
						sellcoinchange();
						//getaccountinfo(account.name);
					}).catch(function (e) {
						e = JSON.parse(e);
						if (e.error.details[0].message != "Invalid packed transaction") {
							Dialog.init(e.error.details[0].message);
						}
					});
				});
			})
		}
	} catch (e) {
		Dialog.init(e);
	}
}

function wantbuy(obj) {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
		return;
	}

	$("#buycoincntid").val('');
	$("#accounteos").text('需支付:0 EOS');
	sellersel = $(obj).parent().parent().find('td').eq(0).html();
	sellerprice = $(obj).parent().parent().find('td').eq(1).find("p").html().split(' ')[0];

	console.log("seller is " + sellersel + " sellerprice is " + sellerprice);

	// sellorbuy(2);

	$("#sellerlistid").hide();
	$("#actionbuydiv").show();
}

function sell() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checksellcoin() == -1) {
		return -1;
	}

	if (checkprice() == -1) {
		return -1;
	}
	transfersell();
}

function buy() {
	if (loginflag == 0) {
		Dialog.init("请先点击登录");
	}

	if (checkbuycoin() == -1) {
		return -1;
	}

	transferbuy();
}

function checksellcoin() {
	var r = /^[0-9]+$/;
	var count = $("#sellcoincntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}
}

function calbuyneedeos() {
	var cointoeos = accMul($("#buycoincntid").val(), sellerprice);
	if (cointoeos.toFixed(4) != cointoeos) {
		if (cointoeos.toFixed(4) < cointoeos) {
			cointoeos = cointoeos + 0.0001;
		}
	}
	$("#accounteos").text("需支付:" + cointoeos.toFixed(4) + " EOS");
}

function checkbuycoin() {
	var r = /^[0-9]+$/;
	var count = $("#buycoincntid").val();
	if (!r.test(count)) {
		Dialog.init("数量须为整数");
		return -1;
	}

	var cointoeos = accMul($("#buycoincntid").val(), sellerprice);
	if (cointoeos.toFixed(4) != cointoeos) {
		if (cointoeos.toFixed(4) < cointoeos) {
			cointoeos = cointoeos + 0.0001;
		}
	}

	if (accMul(cointoeos.toFixed(4), 10000) > accMul(g_curliquideos, 10000)) {
		Dialog.init("你的账户EOS余额不足");
		return -1;
	}
}

function checkprice() {
	// var r = /^[0-9]+$/;
	// var count = $("#coinpriceid").val();
	// if (!r.test(count)) {
	// 	Dialog.init("价格须为整数");
	// 	return -1;
	// }
	var price = $("#coinpriceid").val();
	if (!(/(^[0-9]*[1-9][0-9]*$)/.test(price)) &&
		!(/^\d+(\.\d+)?$/.test(price))) {
		Dialog.init("价格输入格式有错，请输入整数或小数");
		return -1;
	}

	if (price < 0.000001) {
		Dialog.init("价格最小须为0.000001 EOS");
		return -1;
	}


	var g = /^\d+(?:\.\d{1,6})?$/;
	if (!g.test(price)) {
		Dialog.init("只支持六位小数");
		return -1;
	}
}

function accMul(arg1, arg2) {

	var m = 0,
		s1 = arg1.toString(),
		s2 = arg2.toString();

	try {
		m += s1.split(".")[1].length
	} catch (e) {}

	try {
		m += s2.split(".")[1].length
	} catch (e) {}

	return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)

}

function sellerdel() {
	$("#sellertablebody").find("tr").filter(".old").remove();

	$("#sellertablebody").find("tr").attr("class", "old");
}

function dealadd(obj) {
	var buyername = obj["buyer_account"];
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var dealindex = obj["pkey"];
	var dealtime = obj["buytime"];
	var tritem = $("#deallistbody").find(document.getElementById(dealindex));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		if (sellerassetname == curcoindeal || curcoindeal == 'all') {
			var tdbuyer = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + buyername + "</td>";
			var tdseller = "<td style='word-wrap:break-word;word-break:break-all;text-align:center;'>" + sellername + "</td>";
			var tdprice = "<td style='text-align:center;'><p >" + sellerprice + "</p></td>";
			var tdcount = "<td style='text-align:center;'>" + sellerassetaccount + " " + sellerassetname + "</td>";
			var tddealtime = "<td style='text-align:center;'>" + formatDateTime(dealtime / 1000) + "</td>";
			var item = "<tr style='font-size:80%;' id='" + dealindex + "' class='update'>" + tdbuyer + tdseller + tdprice + tdcount + tddealtime + "</tr>";

			$("#deallistbody").prepend(item);
		}
	} else {
		tritem.attr("class", "update");
	}
}

function dealdel() {
	$("#deallistbody").find("tr").filter(".old").remove();

	$("#deallistbody").find("tr").attr("class", "old");
}

function selleradd(obj) {
	var sellername = obj["seller_account"];
	var sellerasset = obj["coin"];
	var sellerprice = obj["price"];
	var sellerassetarr = sellerasset.split('.');
	var sellerassetaccount = sellerassetarr[0];
	var sellerassetname = sellerassetarr[1].split(' ')[1];
	var tritem = $("#sellertablebody").find(document.getElementById(sellername + sellerassetname));

	if (sellerassetaccount == 0) {
		return -1;
	}

	if (tritem.length == 0) {
		var tdseller = "<td style='word-wrap:break-word;word-break:break-all;'>" + sellername + "</td>";
		var tdprice = "<td><p >" + sellerprice + "</p></td>";
		var tdcount = "<td>" + sellerassetaccount + "</td>";
		var tdcoinname = "<td>" + sellerassetname + "</td>";
		var tdbuy = "<td><button class='btn' onclick='wantbuy(this)'>购买</button></td>";

		var item = "<tr style='font-size:80%;' id='" + sellername + sellerassetname + "' class='update'>" + tdseller + tdprice + tdcount + tdcoinname + tdbuy + "</tr>";

		$("#sellertablebody").append(item);

	} else {
		var tditem = tritem.find('td');
		tditem.eq(0).html(sellername);
		tditem.eq(1).find("p").text(sellerprice);
		tditem.eq(2).html(sellerassetaccount);
		tritem.attr("class", "update");
	}

}

function sellersort(obj) {
	var cnt = obj.length;
	var tmpobj = '';
	for (var i = 0; i < cnt; i++) {
		for (var j = 0; j < cnt; j++) {
			if (i != j) {
				if (obj[j]["price"] < obj[i]["price"]) {
					tmpobj = obj[j];
					obj[j] = obj[i];
					obj[i] = tmpobj;
				}
			}
		}
	}
}

function getsellerlist() {
	var cointype = $("#tokenul .active").find('a').html().split(' ')[0];
	var pkey = $("#tokenul .active").find('a').attr('id').split(' ')[1];
	console.log("cointype is " + cointype);

	if (cointype != undefined) {
		curcointype = cointype;
	}

	if (curcointype == undefined) {
		return -1;
	}

	console.log("getsellerlist pkey is " + pkey);

	eosjs.getTableRows(true, "cointotheeos", pkey, "sellerlist", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			//console.log(JSON.parse(data));
			//sellersort(data["rows"]);
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				selleradd(data["rows"][i]);
			}

			SortTb(1);

			sellerdel();
		} else {
			console.log(error);
		}
	})
}

function getdeallist() {
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "buyrecords", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				dealadd(data["rows"][i]);
			}

			//SortTb(1);

			dealdel();
		} else {
			console.log(error);
		}
	})
}

function coindeallichange(obj) {
	var symbol = $(obj).html();

	if (symbol != curcoindeal) {
		$("#deallistbody").empty();
	}


	if ($(obj).attr('id') != "coindealallid") {
		curcoindeal = symbol;
		if ($("#coindealul").find(document.getElementById('coindealallid')).length == 0) {
			var coindeal = '';
			coindeal = '<li><a id="coindealallid" onclick="javascript:coindeallichange(this)">全部</a></li>';
			$("#coindealul").prepend(coindeal);
		}
	} else {
		curcoindeal = 'all';
		$(obj).parent().remove();
	}

	$("#coindealtype").html(symbol + '<b class="caret"></b>');
}

function coinadd(obj) {
	var pkey = obj["pkey"];
	var contract = obj["contract"];
	var symbol = obj["quant"].split(' ')[1];
	var enable = obj["enable"];

	if (enable == 0) {
		return 0;
	}

	var coinli = '';

	if (symbol == "BT") {
		coinli = //'<li class="divider"></li>' +
			'<li><a href="#tablediv" data-toggle="tab" id="coin ' +
			pkey + '" class="' + symbol + '" onclick="gohomefroma(this)">' + symbol + ' <i>' + contract + '</i></a></li>';
	} else {
		coinli = //'<li class="divider"></li>' +
			'<li><a href="#tablediv" data-toggle="tab" id="coin ' +
			pkey + '" class="' + symbol + '" onclick="gohomefroma(this)">' + symbol + ' <i>' + contract + '</i></a></li>';
	}

	$("#tokenul").append(coinli);

	var coindeal = '';
	coindeal = '<li><a onclick="javascript:coindeallichange(this)">' + symbol + '</a></li>';
	$("#coindealul").append(coindeal);

	var coinseloption = '<option value="' + contract + " " + symbol + '">' + symbol + '</option>';
	$("#coinname").append(coinseloption);

	if ($("#example-navbar-collapse").find(".active").length == 0) {
		$(".BT").click();
	}
}

function getcoinlist() {
	if(getcoinsflagex == 1)
	{
		return;
	}

	getcoinsflagex = 1;

	if (getcoinsflag == 0) {
		eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "coins", "", 0, -1, 10000, function (error, data) {
			if (error == null) {
				getcoinsflagex = 0;
				getcoinsflag = 1;
				var cnt = data["rows"].length;
				for (var i = 0; i < cnt; i++) {
					coinadd(data["rows"][i]);
				}
			} else {
				getcoinsflagex = 0;
				console.log(error);
			}
		})
	}
}

function getglobaldata() {
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "global", "", 0, -1, 10, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				$("#totaldealasset").text("总成交额: " + data["rows"][i]["dealtotalasset"]);
			}
		} else {
			console.log(error);
		}
	})
}

function scatterloginout() {
	if (tp.isConnected() == true) {
		$("#logindiv").show();
		$("#userinfoul").hide();

		loginflag = 0;

		$("sellli").remove();

		$(".nav-tabs").find(document.getElementById('sellli')).remove();

		checkshishicai('');
	}
	else{
		if (!scatter) {
			Dialog.init("Please install Scatter!");
			return;
		}

		scatter.forgetIdentity().then(function () {
			$("#logindiv").show();
			$("#userinfoul").hide();

			loginflag = 0;

			$("sellli").remove();

			$(".nav-tabs").find(document.getElementById('sellli')).remove();

			checkshishicai('');
		});
	}
}

function scatterLogin() {
	if (tp.isConnected() == true) {
		tp.getCurrentWallet().then(data => {
			curtpwallet = data["data"]["name"];
			loginflag = 1;
			$("#logindiv").hide();
			$("#userinfoul").show();
			$("#usernamea").html(curtpwallet + ' <b class="caret"></b>').css('color', '#1E90FF');
			$("#luli").before("<li id='sellli'><a href='#actiondiv' data-toggle='tab' style='font-size: 19px;'>卖</a></li>");
			checkshishicai(curtpwallet);
			getaccountinfo(curtpwallet);
			sellcoinchange();
		})
	} else {
		if (!scatter) {
			Dialog.init("Please install Scatter!");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			loginflag = 1;
			console.log(account.name + " 已登录");

			$("#logindiv").hide();
			$("#userinfoul").show();
			$("#usernamea").html(account.name + ' <b class="caret"></b>').css('color', '#1E90FF');
			$("#luli").before("<li id='sellli'><a href='#actiondiv' data-toggle='tab' style='font-size: 19px;'>卖</a></li>");
			checkshishicai(account.name);
			getaccountinfo(account.name);
			sellcoinchange();
		}).catch(function (e) {
			console.log(e);
		});
	}
}

function usertakeback(obj) {
	var $item = $(obj).parent().parent();
	var quant = $item.find('td').eq(2).html() + '.0000 ' + $item.find('td').eq(3).html();

	transfergetback(quant);
}

function getuserselllist() {
	$("#userselllisttablebody").empty();
	var curusername = $("#usernamea").html().split(' ')[0];
	console.log("getuserselllist username is " + curusername);
	eosjs.getTableRows(true, "cointotheeos", "cointotheeos", "coins", "", 0, -1, 10000, function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				var pkey = data["rows"][i]["pkey"];
				eosjs.getTableRows(true, "cointotheeos", pkey, "sellerlist", "", 0, -1, 10000, function (error, selldata) {
					if (error == null) {
						var cnt = selldata["rows"].length;
						for (var i = 0; i < cnt; i++) {
							var obj = selldata["rows"][i];
							if (obj["seller_account"] == curusername) {
								var sellername = obj["seller_account"];
								var sellerasset = obj["coin"];
								var sellerprice = obj["price"];
								var sellerassetarr = sellerasset.split('.');
								var sellerassetaccount = sellerassetarr[0];
								var sellerassetname = sellerassetarr[1].split(' ')[1];

								var tdseller = "<td style='word-wrap:break-word;word-break:break-all;'>" + sellername + "</td>";
								var tdprice = "<td><p >" + sellerprice + "</p></td>";
								var tdcount = "<td>" + sellerassetaccount + "</td>";
								var tdcoinname = "<td>" + sellerassetname + "</td>";
								var tdbuy = "<td><button class='btn' onclick='usertakeback(this)'>撤单</button></td>";

								var item = "<tr style='font-size:80%;' id='" + sellername + sellerassetname + "' class='update'>" + tdseller + tdprice + tdcount + tdcoinname + tdbuy + "</tr>";

								$("#userselllisttablebody").append(item);
							}
						}
					} else {
						console.log(error);
					}
				})
			}
		} else {
			console.log(error);
		}
	})

}

function checkshishicai(name) {
	$("#lushishicaibtn").html("GET 0.1 EOS");
	$("#lushishicaibtn").removeAttr('disabled');
	$("#luwizboxbtn").html("GET 2 WIZBOX");
	$("#luwizboxbtn").removeAttr('disabled');
	$("#luteabtn").html("GET 200 TEA");
	$("#luteabtn").removeAttr('disabled');
	$("#lucubebtn").html("GET 1000 CUBE");
	$("#lucubebtn").removeAttr('disabled');
	$("#luenbbtn").html("GET 1000 ENB 价值0.2EOS");
	$("#luenbbtn").removeAttr('disabled');
	eosjs.getTableRows(true, "eosplaybrand", "eosplaybrand", "user", "", name, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			for (var i = 0; i < cnt; i++) {
				if (data["rows"][i]["id"] == name) {
					$("#lushishicaibtn").html("此账号已撸0.1EOS");
					$("#lushishicaibtn").attr("disabled", true);
					break;
				}
			}
		} else {
			console.log(error);
		}
	})

	eosjs.getTableRows(true, "linzongsheng", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#luteabtn").html("此账号已撸200TEA");
				$("#luteabtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	eosjs.getTableRows(true, "eoscubetoken", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#lucubebtn").html("此账号已撸1000CUBE");
				$("#lucubebtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	eosjs.getTableRows(true, "eosenbpocket", name, "accounts", "", 0, -1, 1, "i64", "1", function (error, data) {
		if (error == null) {
			var cnt = data["rows"].length;
			if (cnt != 0) {
				$("#luenbbtn").html("此账号已撸1000ENB");
				$("#luenbbtn").attr("disabled", true);
			}
		} else {
			console.log(error);
		}
	})

	var checkurl = 'https://adb.wizards.one/' + name;
	console.log("checkurl is" + checkurl);
	$.ajax({
		type: 'get',
		mode: "no-cors",
		datatype: 'text',
		url: checkurl,
		success: function (data) {
			console.log("data is " + data["claimed"]);
			if (data["claimed"] == true) {
				$("#luwizboxbtn").html("此账号已撸 WIZBOX");
				$("#luwizboxbtn").attr("disabled", true);
			} else {
				$("#luwizboxbtn").html("GET " + data["quantity"] + " WIZBOX");
				$("#luwizboxbtn").removeAttr('disabled');
			}
		},
	});
}

function luwizbox() {
	if (tp.isConnected() == true) {
		var query = 'account=' + g_curtpwallet;

		var claimurl = 'https://adb.wizards.one/claim';
		$.ajax({
			type: 'post',
			data: query,
			mode: "no-cors",
			datatype: 'text',
			url: claimurl,
			success: function (data) {
				// console.log(data);
				// Dialog.init('Success!');
			},
		});
		var curaccount = g_curtpwallet;
		var contract = "eosio.msig";
		var action = "approve";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "proposer";
		paramval = "wizboxsender";
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "proposal_name";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "level";
		paramval = {
			actor: curaccount,
			permission: "active"
		};
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"proposer":"wizboxsender", "proposal_name":"' + curaccount + '", "level":{"actor":"' + curaccount + '","permission":"active"}}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
			var execurl = 'https://adb.wizards.one/exec';
			$.ajax({
				type: 'post',
				data: query,
				mode: "no-cors",
				datatype: 'text',
				url: execurl,
				success: function (data) {
					checkshishicai(curaccount);
				},
			});


		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			var query = 'account=' + account.name;

			var claimurl = 'https://adb.wizards.one/claim';
			$.ajax({
				type: 'post',
				data: query,
				mode: "no-cors",
				datatype: 'text',
				url: claimurl,
				success: function (data) {
					// console.log(data);
					// Dialog.init('Success!');
				},
			});

			eos.contract('eosio.msig', options).then(contract => {
				var level = {
					"actor": account.name,
					"permission": "active"
				};
				contract.approve("wizboxsender", account.name, level, options).then(function (tx) {
					Dialog.init('Success!');

					var execurl = 'https://adb.wizards.one/exec';
					$.ajax({
						type: 'post',
						data: query,
						mode: "no-cors",
						datatype: 'text',
						url: execurl,
						success: function (data) {
							checkshishicai(account.name);
							// console.log(data);
							// Dialog.init('Success!');
						},
					});

					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});

		})
	}
}

function lutea() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "linzongsheng";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "200.0000 TEA";
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "ram_payer";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"200.0000 TEA", "ram_payer":"' + curaccount + '"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('linzongsheng', options).then(contract => {
				contract.signup(account.name, "0.0000 TEA", account.name, options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function luenb() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "eosenbpocket";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "0.0000 ENB";
		paramdata += '"' + paramname + '":"' + paramval + '"';
		paramname = "ram_payer";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"1000.0001 ENB", "ram_payer":"' + curaccount + '"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosenbpocket', options).then(contract => {
				contract.signup(account.name, "1000.0001 ENB", account.name, options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function lucube() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "eoscubetoken";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "1000.0000 CUBE";
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{"owner":"' + curaccount + '", "quantity":"0.0000 CUBE"}}], "address":"'+g_curtpwalletaddress+'", "account":"'+curaccount+'"}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			if (e.error.details[0].message != "Invalid packed transaction") {
				Dialog.init(e.error.details[0].message);
			}
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eoscubetoken', options).then(contract => {
				contract.signup(account.name, "0.0000 CUBE", options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					if (e.error.details[0].message != "Invalid packed transaction") {
						Dialog.init(e.error.details[0].message);
					}
				});
			});
		})
	}
}

function lushishicai() {
	Dialog.init("已暂停");
	return;
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		tp.eosTokenTransfer({
			from: curaccount,
			to: 'eosplaybrand',
			amount: '0.3000',
			tokenName: 'EOS',
			precision: 4,
			contract: 'eosio.token',
			memo: "dice:o2@wayunggogogo",
		}).then(function (data) {
			//Dialog.init('Success!');
			checkshishicai(curaccount);
		}).catch(function (e) {
			Dialog.init('Tx failed: ' + e.error.details[0].message);
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosio.token', options).then(contract => {
				contract.transfer(account.name, "eosplaybrand", "0.3000 EOS", "dice:o2@wayunggogogo", options).then(function (tx) {
					Dialog.init('Success!');
					checkshishicai(account.name);
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					Dialog.init('Tx failed: ' + e.error.details[0].message);
				});
			});

		})
	}
}

function luseven() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "xxxsevensxxx";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "10000.0000 SEVEN";
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{' + paramdata + '}}]}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			Dialog.init(e.error.details[0].message);
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('xxxsevensxxx', options).then(contract => {
				contract.signup(account.name, "10000.0000 SEVEN", options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					Dialog.init(e.error.details[0].message);
				});
			});
		})
	}
}

function ludice() {
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "betdicetoken";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "owner";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "quantity";
		paramval = "1000.0000 DICE";
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{' + paramdata + '}}]}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			Dialog.init(e.error.details[0].message);
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('betdicetoken', options).then(contract => {
				contract.signup(account.name, "1000.0000 DICE", options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					Dialog.init(e.error.details[0].message);
				});
			});
		})
	}
}

function lumev() {
	Dialog.init("已暂停");
	return;
	if (tp.isConnected() == true) {
		var curaccount = g_curtpwallet;
		var contract = "eosvegasjack";
		var action = "signup";
		var paramdata = '';
		var paramname = '';
		var paramval = '';
		paramname = "from";
		paramval = curaccount;
		paramdata += '"' + paramname + '":"' + paramval + '",';
		paramname = "memo";
		paramval = "Get 100 MEV from coindex, https://eoscoinexchange.github.io/coinexchange";
		paramdata += '"' + paramname + '":"' + paramval + '"';

		var actionstr = '{"actions":[{"account":"' + contract + '","name":"' + action + '","authorization":[{"actor":"' + curaccount + '","permission":"active"}],"data":{' + paramdata + '}}]}';
		var params = JSON.parse(actionstr);
		tp.pushEosAction(params).then(data => {
			//Dialog.init('Success!');
		}).catch(function (e) {
			Dialog.init('Tx failed: ' + e.error.details[0].message);
		});
	} else {
		if (loginflag == 0) {
			Dialog.init("请先点击登录");
			return;
		}

		scatter.getIdentity({
			accounts: [network]
		}).then(function (identity) {
			var account = identity.accounts[0];
			var options = {
				authorization: account.name + '@' + account.authority,
				broadcast: true,
				sign: true
			};

			eos.contract('eosvegasjack', options).then(contract => {
				contract.signup(account.name, "Get 100 MEV from coindex, https://eoscoinexchange.github.io/coinexchange", options).then(function (tx) {
					Dialog.init('Success!');
					//getaccountinfo(account.name);
				}).catch(function (e) {
					console.log(e);
					e = JSON.parse(e);
					Dialog.init('Tx failed: ' + e.error.details[0].message);
				});
			});
		})
	}
}

function gohome() {
	$("." + curcointype).click();
	$("#sellerlistid").show();
	$("#actionbuydiv").hide();
}

function gohomefroma(obj) {
	var cointype = $(obj).html().split(' ')[0];
	$("#sellerlistid").show();
	$("#actionbuydiv").hide();
	$("#buycoincntid").attr("placeholder", "请输入想购买的" + cointype + "数量");
}

$(function () {
	$("#mainul").click(function () {
		$("#userinfoul").find('li').removeClass("active");
	})

	$("#userinfoul").click(function () {
		$("#mainul").find('li').removeClass("active");
	})

	gettpwalletlist();
	EosjsInit();
	document.addEventListener('scatterLoaded', function (scatterExtension) {
		console.log("scatterLoaded enter");
		scatter = window.scatter;
		eos = scatter.eos(network, Eos, {}, "https");
	});

	setInterval(getcoinlist, 2000);
	setInterval(getsellerlist, 1000);
	setInterval(getdeallist, 2000);
	setInterval(getglobaldata, 3000);
})